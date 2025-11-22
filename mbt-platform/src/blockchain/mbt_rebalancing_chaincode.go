// MBT Rebalancing Chaincode - Automated portfolio rebalancing
// Handles time-based and deviation-based rebalancing of metal basket tokens

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// RebalanceRequest represents a rebalancing operation request
type RebalanceRequest struct {
	RequestID     string    `json:"requestId"`
	BasketID      string    `json:"basketId"`
	RequestType   string    `json:"requestType"` // "TIME" or "DEVIATION"
	TriggerReason string    `json:"triggerReason"`
	CurrentAlloc  map[string]float64 `json:"currentAllocation"` // Current percentages
	TargetAlloc   map[string]float64 `json:"targetAllocation"` // Target percentages
	Deviations    map[string]float64 `json:"deviations"`       // Deviations from target
	Status        string    `json:"status"`         // "PENDING", "APPROVED", "EXECUTED", "FAILED"
	CreatedAt     string    `json:"createdAt"`
	ExecutedAt    string    `json:"executedAt"`
	ApprovalRequired bool   `json:"approvalRequired"`
}

// RebalanceOperation represents a specific metal allocation operation
type RebalanceOperation struct {
	OperationID   string  `json:"operationId"`
	RequestID     string  `json:"requestId"`
	MetalType     string  `json:"metalType"` // "BGT", "BST", "BPT"
	OperationType string  `json:"operationType"` // "BUY", "SELL"
	Amount        float64 `json:"amount"`    // Amount to buy/sell
	CurrentPrice  float64 `json:"currentPrice"`
	EstimatedCost float64 `json:"estimatedCost"`
	Timestamp     string  `json:"timestamp"`
}

// RebalancePolicy defines the rebalancing rules
type RebalancePolicy struct {
	PolicyID              string  `json:"policyId"`
	Name                  string  `json:"name"`
	GoldAllocation        float64 `json:"goldAllocation"`        // 50%
	SilverAllocation      float64 `json:"silverAllocation"`      // 30%
	PlatinumAllocation    float64 `json:"platinumAllocation"`    // 20%
	MaxDeviationPercent   float64 `json:"maxDeviationPercent"`   // 5%
	RebalanceIntervalDays int     `json:"rebalanceIntervalDays"` // 30
	MinTradeAmount        float64 `json:"minTradeAmount"`        // Minimum trade threshold
	ApprovalThreshold     float64 `json:"approvalThreshold"`     // Amount requiring approval
}

// MBTRebalancingContract handles automated rebalancing operations
type MBTRebalancingContract struct {
	contractapi.Contract
}

// InitializePolicy sets up the default rebalancing policy
func (c *MBTRebalancingContract) InitializePolicy(ctx contractapi.TransactionContextInterface) error {
	policy := RebalancePolicy{
		PolicyID:             "MBT_DEFAULT_POLICY",
		Name:                 "MBT Standard Rebalancing Policy",
		GoldAllocation:       0.50,
		SilverAllocation:     0.30,
		PlatinumAllocation:   0.20,
		MaxDeviationPercent:  0.05,
		RebalanceIntervalDays: 30,
		MinTradeAmount:       1000.0, // Minimum 1000 INR trade
		ApprovalThreshold:    100000.0, // Requires approval for trades > 100k INR
	}

	policyJSON, err := json.Marshal(policy)
	if err != nil {
		return fmt.Errorf("failed to marshal policy: %v", err)
	}

	err = ctx.GetStub().PutState("REBALANCE_POLICY", policyJSON)
	if err != nil {
		return fmt.Errorf("failed to store policy: %v", err)
	}

	log.Println("Initialized MBT rebalancing policy")
	return nil
}

// GetRebalancePolicy retrieves the current rebalancing policy
func (c *MBTRebalancingContract) GetRebalancePolicy(ctx contractapi.TransactionContextInterface) (*RebalancePolicy, error) {
	policyJSON, err := ctx.GetStub().GetState("REBALANCE_POLICY")
	if err != nil {
		return nil, fmt.Errorf("failed to read policy: %v", err)
	}

	if policyJSON == nil {
		return nil, fmt.Errorf("rebalance policy not initialized")
	}

	var policy RebalancePolicy
	err = json.Unmarshal(policyJSON, &policy)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal policy: %v", err)
	}

	return &policy, nil
}

// EvaluateRebalanceNeed evaluates if rebalancing is required
func (c *MBTRebalancingContract) EvaluateRebalanceNeed(ctx contractapi.TransactionContextInterface) error {
	log.Println("Evaluating rebalancing requirements...")

	// Get current basket holdings
	holdings, err := c.GetBasketHoldings(ctx)
	if err != nil {
		return fmt.Errorf("failed to get basket holdings: %v", err)
	}

	if holdings.TotalMBTSupply == 0 {
		log.Println("No MBT tokens in circulation, skipping evaluation")
		return nil
	}

	// Get rebalancing policy
	policy, err := c.GetRebalancePolicy(ctx)
	if err != nil {
		return fmt.Errorf("failed to get rebalance policy: %v", err)
	}

	totalValue := holdings.TotalBGTValue + holdings.TotalBSTValue + holdings.TotalBPTValue
	if totalValue == 0 {
		log.Println("No underlying metal values, skipping evaluation")
		return nil
	}

	// Calculate current allocations as percentages
	currentAlloc := map[string]float64{
		"gold":     holdings.TotalBGTValue / totalValue,
		"silver":   holdings.TotalBSTValue / totalValue,
		"platinum": holdings.TotalBPTValue / totalValue,
	}

	// Define target allocations
	targetAlloc := map[string]float64{
		"gold":     policy.GoldAllocation,
		"silver":   policy.SilverAllocation,
		"platinum": policy.PlatinumAllocation,
	}

	// Calculate deviations
	deviations := map[string]float64{
		"gold":     currentAlloc["gold"] - targetAlloc["gold"],
		"silver":   currentAlloc["silver"] - targetAlloc["silver"],
		"platinum": currentAlloc["platinum"] - targetAlloc["platinum"],
	}

	// Check for significant deviations
	maxDeviation := 0.0
	triggerType := ""
	triggerReason := ""

	for metal, deviation := range deviations {
		absDeviation := math.Abs(deviation)
		if absDeviation > maxDeviation {
			maxDeviation = absDeviation
			triggerType = "DEVIATION"
			triggerReason = fmt.Sprintf("Deviation in %s allocation: %.2f%%", metal, absDeviation*100)
		}
	}

	// Check time-based rebalancing
	lastRebalance, err := time.Parse(time.RFC3339, holdings.LastRebalance)
	if err != nil {
		log.Printf("Warning: Could not parse last rebalance time: %v", err)
		lastRebalance = time.Now().Add(-24 * time.Hour) // Assume recent rebalance
	}

	daysSinceRebalance := time.Since(lastRebalance).Hours() / 24
	if daysSinceRebalance >= float64(policy.RebalanceIntervalDays) {
		if maxDeviation < policy.MaxDeviationPercent {
			// Time-based trigger
			triggerType = "TIME"
			triggerReason = fmt.Sprintf("Scheduled rebalancing after %.0f days", daysSinceRebalance)
		}
	}

	// Create rebalance request if needed
	if triggerType != "" && maxDeviation >= policy.MaxDeviationPercent {
		err = c.CreateRebalanceRequest(ctx, currentAlloc, targetAlloc, deviations, triggerType, triggerReason)
		if err != nil {
			return fmt.Errorf("failed to create rebalance request: %v", err)
		}
	} else {
		log.Printf("Rebalancing not needed. Max deviation: %.2f%%, Threshold: %.2f%%", 
			maxDeviation*100, policy.MaxDeviationPercent*100)
	}

	return nil
}

// CreateRebalanceRequest creates a new rebalancing request
func (c *MBTRebalancingContract) CreateRebalanceRequest(ctx contractapi.TransactionContextInterface, 
	currentAlloc, targetAlloc, deviations map[string]float64, requestType, reason string) error {

	requestID := fmt.Sprintf("REBAL-%d", time.Now().UnixNano())

	request := RebalanceRequest{
		RequestID:       requestID,
		BasketID:        "MBT_BASKET",
		RequestType:     requestType,
		TriggerReason:   reason,
		CurrentAlloc:    currentAlloc,
		TargetAlloc:     targetAlloc,
		Deviations:      deviations,
		Status:          "PENDING",
		CreatedAt:       time.Now().Format(time.RFC3339),
		ApprovalRequired: true,
	}

	// Determine if approval is required based on policy
	policy, err := c.GetRebalancePolicy(ctx)
	if err != nil {
		return fmt.Errorf("failed to get policy: %v", err)
	}

	// Calculate estimated trade amounts to determine approval requirement
	holdings, err := c.GetBasketHoldings(ctx)
	if err != nil {
		return fmt.Errorf("failed to get holdings: %v", err)
	}

	totalValue := holdings.TotalBGTValue + holdings.TotalBSTValue + holdings.TotalBPTValue
	maxTradeAmount := 0.0

	for metal, deviation := range deviations {
		if deviation != 0 {
			metalValue := totalValue * math.Abs(deviation)
			if metalValue > maxTradeAmount {
				maxTradeAmount = metalValue
			}
		}
	}

	request.ApprovalRequired = maxTradeAmount >= policy.ApprovalThreshold

	requestJSON, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	err = ctx.GetStub().PutState(requestID, requestJSON)
	if err != nil {
		return fmt.Errorf("failed to store request: %v", err)
	}

	log.Printf("Created rebalance request: %s (Type: %s, Approval Required: %t)", 
		requestID, requestType, request.ApprovalRequired)

	// Generate specific rebalancing operations
	err = c.GenerateRebalanceOperations(ctx, requestID, deviations, holdings, totalValue)
	if err != nil {
		return fmt.Errorf("failed to generate rebalance operations: %v", err)
	}

	return nil
}

// GenerateRebalanceOperations creates specific trade operations for rebalancing
func (c *MBTRebalancingContract) GenerateRebalanceOperations(ctx contractapi.TransactionContextInterface, 
	requestID string, deviations map[string]float64, holdings *BasketHolding, totalValue float64) error {

	prices, err := c.GetCurrentMetalPrices(ctx)
	if err != nil {
		return fmt.Errorf("failed to get current prices: %v", err)
	}

	policy, err := c.GetRebalancePolicy(ctx)
	if err != nil {
		return fmt.Errorf("failed to get policy: %v", err)
	}

	// Define metal mapping
	metalMapping := map[string]string{
		"gold":     "BGT",
		"silver":   "BST",
		"platinum": "BPT",
	}

	for metal, deviation := range deviations {
		if math.Abs(deviation) < 0.001 { // Skip very small deviations
			continue
		}

		metalType := metalMapping[metal]
		operationType := "BUY"
		if deviation < 0 {
			operationType = "SELL"
		}

		// Calculate trade amount
		tradeAmount := math.Abs(deviation) * totalValue
		if tradeAmount < policy.MinTradeAmount {
			log.Printf("Skipping rebalancing operation for %s: amount %.2f below minimum %.2f", 
				metal, tradeAmount, policy.MinTradeAmount)
			continue
		}

		// Calculate estimated cost
		unitPrice := 1.0 // Simplified - would use actual metal price
		if metal == "gold" {
			unitPrice = prices["BGT"]
		} else if metal == "silver" {
			unitPrice = prices["BST"]
		} else if metal == "platinum" {
			unitPrice = prices["BPT"]
		}

		operation := RebalanceOperation{
			OperationID:   fmt.Sprintf("OP-%d", time.Now().UnixNano()),
			RequestID:     requestID,
			MetalType:     metalType,
			OperationType: operationType,
			Amount:        tradeAmount,
			CurrentPrice:  unitPrice,
			EstimatedCost: tradeAmount * unitPrice,
			Timestamp:     time.Now().Format(time.RFC3339),
		}

		operationJSON, err := json.Marshal(operation)
		if err != nil {
			return fmt.Errorf("failed to marshal operation: %v", err)
		}

		err = ctx.GetStub().PutState(operation.OperationID, operationJSON)
		if err != nil {
			return fmt.Errorf("failed to store operation: %v", err)
		}

		log.Printf("Generated operation: %s - %s %.2f %s at %.2f INR", 
			operation.OperationID, operationType, tradeAmount, metalType, unitPrice)
	}

	return nil
}

// GetCurrentMetalPrices gets current market prices for metals
func (c *MBTRebalancingContract) GetCurrentMetalPrices(ctx contractapi.TransactionContextInterface) (map[string]float64, error) {
	// In real implementation, would query external price feeds
	prices := map[string]float64{
		"BGT":     5800.0,  // Gold per gram in INR
		"BST":     75.0,    // Silver per gram in INR  
		"BPT":     3200.0,  // Platinum per gram in INR
	}

	return prices, nil
}

// ApproveRebalanceRequest approves a pending rebalance request
func (c *MBTRebalancingContract) ApproveRebalanceRequest(ctx contractapi.TransactionContextInterface, 
	requestID, approverID string) error {

	requestJSON, err := ctx.GetStub().GetState(requestID)
	if err != nil {
		return fmt.Errorf("failed to read request: %v", err)
	}

	if requestJSON == nil {
		return fmt.Errorf("request %s not found", requestID)
	}

	var request RebalanceRequest
	err = json.Unmarshal(requestJSON, &request)
	if err != nil {
		return fmt.Errorf("failed to unmarshal request: %v", err)
	}

	if request.Status != "PENDING" {
		return fmt.Errorf("request is not in PENDING status")
	}

	if !request.ApprovalRequired {
		return fmt.Errorf("request does not require approval")
	}

	// Update status
	request.Status = "APPROVED"
	request.ExecutedAt = time.Now().Format(time.RFC3339)

	requestJSON, err = json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	err = ctx.GetStub().PutState(requestID, requestJSON)
	if err != nil {
		return fmt.Errorf("failed to store request: %v", err)
	}

	log.Printf("Approved rebalance request: %s by %s", requestID, approverID)
	return nil
}

// ExecuteRebalance executes approved rebalancing operations
func (c *MBTRebalancingContract) ExecuteRebalance(ctx contractapi.TransactionContextInterface, requestID string) error {
	requestJSON, err := ctx.GetStub().GetState(requestID)
	if err != nil {
		return fmt.Errorf("failed to read request: %v", err)
	}

	var request RebalanceRequest
	err = json.Unmarshal(requestJSON, &request)
	if err != nil {
		return fmt.Errorf("failed to unmarshal request: %v", err)
	}

	if request.Status != "APPROVED" && !(request.Status == "PENDING" && !request.ApprovalRequired) {
		return fmt.Errorf("request is not ready for execution")
	}

	log.Printf("Executing rebalance request: %s", requestID)

	// Get all operations for this request
	iterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return fmt.Errorf("failed to get state iterator: %v", err)
	}
	defer iterator.Close()

	var executedOperations []string

	for iterator.HasNext() {
		operationJSON, err := iterator.Next()
		if err != nil {
			return fmt.Errorf("failed to read operation: %v", err)
		}

		var operation RebalanceOperation
		err = json.Unmarshal(operationJSON.Value, &operation)
		if err != nil {
			continue // Skip invalid operations
		}

		if operation.RequestID == requestID {
			// Execute the operation (in real implementation, would interact with trading APIs)
			err = c.ExecuteOperation(ctx, operation)
			if err != nil {
				log.Printf("Failed to execute operation %s: %v", operation.OperationID, err)
				request.Status = "FAILED"
				break
			}

			executedOperations = append(executedOperations, operation.OperationID)
			log.Printf("Executed operation: %s", operation.OperationID)
		}
	}

	if request.Status != "FAILED" {
		request.Status = "EXECUTED"
		request.ExecutedAt = time.Now().Format(time.RFC3339)

		// Update basket holdings to reflect new allocations
		err = c.UpdateBasketAfterRebalance(ctx, request.Deviations)
		if err != nil {
			log.Printf("Warning: Failed to update basket holdings: %v", err)
		}
	}

	requestJSON, err = json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %v", err)
	}

	err = ctx.GetStub().PutState(requestID, requestJSON)
	if err != nil {
		return fmt.Errorf("failed to store request: %v", err)
	}

	log.Printf("Rebalance execution completed. Status: %s, Operations executed: %d", 
		request.Status, len(executedOperations))

	return nil
}

// ExecuteOperation executes a specific rebalancing operation
func (c *MBTRebalancingContract) ExecuteOperation(ctx contractapi.TransactionContextInterface, operation RebalanceOperation) error {
	log.Printf("Executing %s operation for %s: %.2f at %.2f INR", 
		operation.OperationType, operation.MetalType, operation.Amount, operation.CurrentPrice)

	// In real implementation, would:
	// 1. Interact with trading APIs
	// 2. Execute buy/sell orders
	// 3. Update token allocations
	// 4. Record transaction details

	return nil
}

// UpdateBasketAfterRebalance updates basket holdings after successful rebalancing
func (c *MBTRebalancingContract) UpdateBasketAfterRebalance(ctx contractapi.TransactionContextInterface, deviations map[string]float64) error {
	holdings, err := c.GetBasketHoldings(ctx)
	if err != nil {
		return fmt.Errorf("failed to get holdings: %v", err)
	}

	totalValue := holdings.TotalBGTValue + holdings.TotalBSTValue + holdings.TotalBPTValue
	if totalValue == 0 {
		return nil
	}

	// Apply deviations to achieve target allocations
	holdings.TotalBGTValue += deviations["gold"] * totalValue
	holdings.TotalBSTValue += deviations["silver"] * totalValue
	holdings.TotalBPTValue += deviations["platinum"] * totalValue
	holdings.RebalanceNeeded = false
	holdings.LastRebalance = time.Now().Format(time.RFC3339)

	holdingsJSON, err := json.Marshal(holdings)
	if err != nil {
		return fmt.Errorf("failed to marshal holdings: %v", err)
	}

	err = ctx.GetStub().PutState("BASKET_HOLDINGS", holdingsJSON)
	if err != nil {
		return fmt.Errorf("failed to store holdings: %v", err)
	}

	return nil
}

// GetBasketHoldings gets current basket holdings (simplified for rebalance contract)
func (c *MBTRebalancingContract) GetBasketHoldings(ctx contractapi.TransactionContextInterface) (*BasketHolding, error) {
	// In real implementation, would call the main MBT basket contract
	// For now, return mock data
	return &BasketHolding{
		TotalMBTSupply: 10000.0,
		TotalBGTValue:  5000.0,
		TotalBSTValue:  3000.0,
		TotalBPTValue:  2000.0,
		RebalanceNeeded: false,
		LastRebalance: time.Now().Add(-35 * 24 * time.Hour).Format(time.RFC3339), // 35 days ago
	}, nil
}

// GetRebalanceRequests gets all rebalance requests
func (c *MBTRebalancingContract) GetRebalanceRequests(ctx contractapi.TransactionContextInterface) ([]*RebalanceRequest, error) {
	iterator, err := ctx.GetStub().GetStateByRange("REBAL-", "REBEL")
	if err != nil {
		return nil, fmt.Errorf("failed to get requests: %v", err)
	}
	defer iterator.Close()

	var requests []*RebalanceRequest

	for iterator.HasNext() {
		requestJSON, err := iterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to read request: %v", err)
		}

		var request RebalanceRequest
		err = json.Unmarshal(requestJSON.Value, &request)
		if err != nil {
			continue // Skip invalid requests
		}

		requests = append(requests, &request)
	}

	return requests, nil
}

// GetRebalanceOperations gets operations for a specific request
func (c *MBTRebalancingContract) GetRebalanceOperations(ctx contractapi.TransactionContextInterface, requestID string) ([]*RebalanceOperation, error) {
	iterator, err := ctx.GetStub().GetStateByRange("OP-", "OPZ")
	if err != nil {
		return nil, fmt.Errorf("failed to get operations: %v", err)
	}
	defer iterator.Close()

	var operations []*RebalanceOperation

	for iterator.HasNext() {
		operationJSON, err := iterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to read operation: %v", err)
		}

		var operation RebalanceOperation
		err = json.Unmarshal(operationJSON.Value, &operation)
		if err != nil {
			continue // Skip invalid operations
		}

		if operation.RequestID == requestID {
			operations = append(operations, &operation)
		}
	}

	return operations, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(new(MBTRebalancingContract))
	if err != nil {
		log.Panicf("Error creating MBT rebalancing chaincode: %v", err)
	}

	if err := chaincode.Start(); err != nil {
		log.Panicf("Error starting MBT rebalancing chaincode: %v", err)
	}
}