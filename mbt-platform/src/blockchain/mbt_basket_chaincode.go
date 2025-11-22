// MBT Basket Chaincode - Metal Basket Tokens
// A smart contract that manages diversified metal portfolio tokens
// 50% Gold (BGT), 30% Silver (BST), 20% Platinum (BPT)

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// MetalComposition defines the MBT allocation percentages
type MetalComposition struct {
	Gold   float64 `json:"gold"`   // 50%
	Silver float64 `json:"silver"` // 30% 
	Platinum float64 `json:"platinum"` // 20%
}

// MBTToken represents a Metal Basket Token
type MBTToken struct {
	TokenID        string  `json:"tokenId"`
	Owner          string  `json:"owner"`
	TotalValue     float64 `json:"totalValue"`
	BGTAmount      float64 `json:"bgtAmount"`      // Gold allocation in BGT tokens
	BSTAmount      float64 `json:"bstAmount"`      // Silver allocation in BST tokens  
	BPTAmount      float64 `json:"bptAmount"`      // Platinum allocation in BPT tokens
	CreationTime   string  `json:"creationTime"`
	LastRebalance  string  `json:"lastRebalance"`
	Composition    MetalComposition `json:"composition"`
}

// BasketHolding represents collective basket holdings
type BasketHolding struct {
	TotalMBTSupply   float64 `json:"totalMbtSupply"`
	TotalBGTValue    float64 `json:"totalBgtValue"`  // Total gold value in basket
	TotalBSTValue    float64 `json:"totalBstValue"`  // Total silver value in basket
	TotalBPTValue    float64 `json:"totalBptValue"`  // Total platinum value in basket
	RebalanceNeeded  bool    `json:"rebalanceNeeded"`
	LastRebalance    string  `json:"lastRebalance"`
}

// MBTBasketContract is the main smart contract for MBT operations
type MBTBasketContract struct {
	contractapi.Contract
}

// Composition percentages (initialized at contract deployment)
const (
	GOLD_ALLOCATION   = 0.50  // 50%
	SILVER_ALLOCATION = 0.30  // 30%
	PLATINUM_ALLOCATION = 0.20 // 20%
)

// Rebalancing thresholds
const (
	MAX_DEVIATION_PERCENT = 0.05 // 5% deviation triggers rebalance
	REBALANCE_INTERVAL_DAYS = 30 // 30 days maximum between rebalances
)

// MintMBT mints new MBT tokens by allocating funds to BGT, BST, BPT
func (c *MBTBasketContract) MintMBT(ctx contractapi.TransactionContextInterface, 
	owner string, totalAmount float64, userID string) error {
	
	log.Printf("Minting MBT tokens: Owner=%s, Amount=%.2f, UserID=%s", owner, totalAmount, userID)
	
	// Verify user has sufficient balance or payment
	balance, err := c.GetUserBalance(ctx, userID, totalAmount)
	if err != nil {
		return fmt.Errorf("failed to get user balance: %v", err)
	}
	if balance < totalAmount {
		return fmt.Errorf("insufficient balance: required %.2f, available %.2f", totalAmount, balance)
	}
	
	// Calculate allocation amounts
	goldAmount := totalAmount * GOLD_ALLOCATION
	silverAmount := totalAmount * SILVER_ALLOCATION
	platinumAmount := totalAmount * PLATINUM_ALLOCATION
	
	// Generate unique token ID
	tokenID := fmt.Sprintf("MBT-%d", time.Now().UnixNano())
	
	// Create MBT token record
	mbtToken := MBTToken{
		TokenID:     tokenID,
		Owner:       owner,
		TotalValue:  totalAmount,
		BGTAmount:   goldAmount,
		BSTAmount:   silverAmount,
		BPTAmount:   platinumAmount,
		CreationTime: time.Now().Format(time.RFC3339),
		LastRebalance: time.Now().Format(time.RFC3339),
		Composition: MetalComposition{
			Gold:     GOLD_ALLOCATION * 100,
			Silver:   SILVER_ALLOCATION * 100,
			Platinum: PLATINUM_ALLOCATION * 100,
		},
	}
	
	// Store MBT token
	tokenJSON, err := json.Marshal(mbtToken)
	if err != nil {
		return fmt.Errorf("failed to marshal token: %v", err)
	}
	
	err = ctx.GetStub().PutState(tokenID, tokenJSON)
	if err != nil {
		return fmt.Errorf("failed to store token: %v", err)
	}
	
	// Deduct payment from user account
	err = c.DeductUserBalance(ctx, userID, totalAmount)
	if err != nil {
		return fmt.Errorf("failed to deduct balance: %v", err)
	}
	
	// Allocate to underlying metal tokens (simulate blockchain calls)
	err = c.AllocateToMetalTokens(ctx, userID, goldAmount, silverAmount, platinumAmount)
	if err != nil {
		return fmt.Errorf("failed to allocate to metal tokens: %v", err)
	}
	
	// Update basket holdings
	err = c.UpdateBasketHoldings(ctx, totalAmount, goldAmount, silverAmount, platinumAmount, true)
	if err != nil {
		return fmt.Errorf("failed to update basket holdings: %v", err)
	}
	
	log.Printf("Successfully minted MBT token: %s", tokenID)
	return nil
}

// AllocateToMetalTokens simulates allocation to BGT, BST, BPT tokens
func (c *MBTBasketContract) AllocateToMetalTokens(ctx contractapi.TransactionContextInterface, 
	userID string, goldAmount, silverAmount, platinumAmount float64) error {
	
	// In a real implementation, this would interact with BGT, BST, BPT chaincodes
	log.Printf("Allocating to metal tokens: Gold=%.2f, Silver=%.2f, Platinum=%.2f", 
		goldAmount, silverAmount, platinumAmount)
	
	// Simulate successful allocation
	return nil
}

// GetMBTToken retrieves MBT token information
func (c *MBTBasketContract) GetMBTToken(ctx contractapi.TransactionContextInterface, tokenID string) (*MBTToken, error) {
	tokenJSON, err := ctx.GetStub().GetState(tokenID)
	if err != nil {
		return nil, fmt.Errorf("failed to read token data: %v", err)
	}
	
	if tokenJSON == nil {
		return nil, fmt.Errorf("token %s does not exist", tokenID)
	}
	
	var token MBTToken
	err = json.Unmarshal(tokenJSON, &token)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal token: %v", err)
	}
	
	return &token, nil
}

// GetBasketHoldings retrieves current basket holdings
func (c *MBTBasketContract) GetBasketHoldings(ctx contractapi.TransactionContextInterface) (*BasketHolding, error) {
	holdingsJSON, err := ctx.GetStub().GetState("BASKET_HOLDINGS")
	if err != nil {
		return nil, fmt.Errorf("failed to read holdings data: %v", err)
	}
	
	if holdingsJSON == nil {
		// Initialize basket holdings
		holdings := BasketHolding{
			TotalMBTSupply: 0,
			TotalBGTValue:  0,
			TotalBSTValue:  0,
			TotalBPTValue:  0,
			RebalanceNeeded: false,
			LastRebalance: time.Now().Format(time.RFC3339),
		}
		
		return &holdings, nil
	}
	
	var holdings BasketHolding
	err = json.Unmarshal(holdingsJSON, &holdings)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal holdings: %v", err)
	}
	
	return &holdings, nil
}

// UpdateBasketHoldings updates the basket aggregate holdings
func (c *MBTBasketContract) UpdateBasketHoldings(ctx contractapi.TransactionContextInterface, 
	mbtAmount, bgtValue, bstValue, bptValue float64, isMint bool) error {
	
	holdings, err := c.GetBasketHoldings(ctx)
	if err != nil {
		return err
	}
	
	if isMint {
		holdings.TotalMBTSupply += mbtAmount
		holdings.TotalBGTValue += bgtValue
		holdings.TotalBSTValue += bstValue
		holdings.TotalBPTValue += bptValue
	} else {
		holdings.TotalMBTSupply -= mbtAmount
		holdings.TotalBGTValue -= bgtValue
		holdings.TotalBSTValue -= bstValue
		holdings.TotalBPTValue -= bptValue
	}
	
	// Check if rebalancing is needed
	holdings.RebalanceNeeded = c.CheckRebalanceNeeded(holdings)
	
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

// CheckRebalanceNeeded determines if portfolio rebalancing is required
func (c *MBTBasketContract) CheckRebalanceNeeded(holdings *BasketHolding) bool {
	if holdings.TotalMBTSupply == 0 {
		return false
	}
	
	totalValue := holdings.TotalBGTValue + holdings.TotalBSTValue + holdings.TotalBPTValue
	if totalValue == 0 {
		return false
	}
	
	// Calculate current allocations
	currentGoldPct := holdings.TotalBGTValue / totalValue
	currentSilverPct := holdings.TotalBSTValue / totalValue
	currentPlatinumPct := holdings.TotalBPTValue / totalValue
	
	// Check deviations from target allocations
	goldDeviation := abs(currentGoldPct - GOLD_ALLOCATION)
	silverDeviation := abs(currentSilverPct - SILVER_ALLOCATION)
	platinumDeviation := abs(currentPlatinumPct - PLATINUM_ALLOCATION)
	
	// Trigger rebalancing if any allocation deviates by more than threshold
	if goldDeviation > MAX_DEVIATION_PERCENT || 
		silverDeviation > MAX_DEVIATION_PERCENT || 
		platinumDeviation > MAX_DEVIATION_PERCENT {
		return true
	}
	
	// Check time-based rebalancing
	lastRebalance, err := time.Parse(time.RFC3339, holdings.LastRebalance)
	if err != nil {
		return true // If we can't parse the date, trigger rebalance
	}
	
	daysSinceRebalance := time.Since(lastRebalance).Hours() / 24
	if daysSinceRebalance >= REBALANCE_INTERVAL_DAYS {
		return true
	}
	
	return false
}

// abs returns absolute value of a float64
func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

// RedeemMBT redeems MBT tokens for underlying metals
func (c *MBTBasketContract) RedeemMBT(ctx contractapi.TransactionContextInterface, 
	tokenID string, amount float64, userID string) error {
	
	log.Printf("Redeeming MBT tokens: TokenID=%s, Amount=%.2f, UserID=%s", tokenID, amount, userID)
	
	// Get MBT token
	token, err := c.GetMBTToken(ctx, tokenID)
	if err != nil {
		return err
	}
	
	// Verify ownership
	if token.Owner != userID {
		return fmt.Errorf("unauthorized: user does not own this token")
	}
	
	if amount > token.TotalValue {
		return fmt.Errorf("insufficient token balance: requested %.2f, available %.2f", amount, token.TotalValue)
	}
	
	// Calculate redemption amounts based on current composition
	redemptionRatio := amount / token.TotalValue
	redemptionBGT := token.BGTAmount * redemptionRatio
	redemptionBST := token.BSTAmount * redemptionRatio
	redemptionBPT := token.BPTAmount * redemptionRatio
	
	// Process redemption (in real implementation, would interact with metal token chaincodes)
	err = c.ProcessMetalRedemption(ctx, userID, redemptionBGT, redemptionBST, redemptionBPT)
	if err != nil {
		return fmt.Errorf("failed to process metal redemption: %v", err)
	}
	
	// Update token amount or delete if fully redeemed
	if amount == token.TotalValue {
		err = ctx.GetStub().DelState(tokenID)
		if err != nil {
			return fmt.Errorf("failed to delete token: %v", err)
		}
	} else {
		token.TotalValue -= amount
		token.BGTAmount -= redemptionBGT
		token.BSTAmount -= redemptionBST
		token.BPTAmount -= redemptionBPT
		token.LastRebalance = time.Now().Format(time.RFC3339)
		
		tokenJSON, err := json.Marshal(token)
		if err != nil {
			return fmt.Errorf("failed to marshal updated token: %v", err)
		}
		
		err = ctx.GetStub().PutState(tokenID, tokenJSON)
		if err != nil {
			return fmt.Errorf("failed to store updated token: %v", err)
		}
	}
	
	// Update basket holdings
	err = c.UpdateBasketHoldings(ctx, amount, redemptionBGT, redemptionBST, redemptionBPT, false)
	if err != nil {
		return fmt.Errorf("failed to update basket holdings: %v", err)
	}
	
	log.Printf("Successfully redeemed MBT token: %s", tokenID)
	return nil
}

// ProcessMetalRedemption processes redemption of underlying metal tokens
func (c *MBTBasketContract) ProcessMetalRedemption(ctx contractapi.TransactionContextInterface, 
	userID string, bgtAmount, bstAmount, bptAmount float64) error {
	
	log.Printf("Processing metal redemption for user %s: BGT=%.2f, BST=%.2f, BPT=%.2f", 
		userID, bgtAmount, bstAmount, bptAmount)
	
	// In real implementation, would interact with BGT, BST, BPT chaincodes
	return nil
}

// GetUserBalance gets user account balance (simulation)
func (c *MBTBasketContract) GetUserBalance(ctx contractapi.TransactionContextInterface, userID string, amount float64) (float64, error) {
	// In real implementation, would query user account balance
	return 1000000.0, nil // Simulate sufficient balance
}

// DeductUserBalance deducts amount from user balance (simulation)
func (c *MBTBasketContract) DeductUserBalance(ctx contractapi.TransactionContextInterface, userID string, amount float64) error {
	// In real implementation, would deduct from user account
	log.Printf("Deducting %.2f from user %s balance", amount, userID)
	return nil
}

// RebalanceBasket performs portfolio rebalancing
func (c *MBTBasketContract) RebalanceBasket(ctx contractapi.TransactionContextInterface) error {
	log.Println("Starting basket rebalancing process")
	
	holdings, err := c.GetBasketHoldings(ctx)
	if err != nil {
		return err
	}
	
	if !holdings.RebalanceNeeded {
		log.Println("Rebalancing not needed at this time")
		return nil
	}
	
	totalValue := holdings.TotalBGTValue + holdings.TotalBSTValue + holdings.TotalBPTValue
	if totalValue == 0 {
		log.Println("No holdings to rebalance")
		return nil
	}
	
	// Calculate target allocations
	targetBGT := totalValue * GOLD_ALLOCATION
	targetBST := totalValue * SILVER_ALLOCATION
	targetBPT := totalValue * PLATINUM_ALLOCATION
	
	// Calculate rebalancing needs
	rebalanceBGT := targetBGT - holdings.TotalBGTValue
	rebalanceBST := targetBST - holdings.TotalBSTValue
	rebalanceBPT := targetBPT - holdings.TotalBPTValue
	
	log.Printf("Rebalancing requirements: BGT=%.2f, BST=%.2f, BPT=%.2f", 
		rebalanceBGT, rebalanceBST, rebalanceBPT)
	
	// In real implementation, would execute rebalancing trades
	// For now, just update the holdings to reflect the rebalancing
	holdings.TotalBGTValue = targetBGT
	holdings.TotalBSTValue = targetBST
	holdings.TotalBPTValue = targetBPT
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
	
	log.Println("Basket rebalancing completed successfully")
	return nil
}

// GetMBTPrices retrieves current prices for metals (simulation)
func (c *MBTBasketContract) GetMBTPrices(ctx contractapi.TransactionContextInterface) (map[string]float64, error) {
	prices := map[string]float64{
		"BGT": 5800.0,  // Gold price per gram in INR
		"BST": 75.0,    // Silver price per gram in INR
		"BPT": 3200.0,  // Platinum price per gram in INR
	}
	
	return prices, nil
}

// GetUserMBTTokens gets all MBT tokens owned by a user
func (c *MBTBasketContract) GetUserMBTTokens(ctx contractapi.TransactionContextInterface, userID string) ([]*MBTToken, error) {
	// Query iterator for all tokens owned by user
	// In real implementation, would use CouchDB query
	return []*MBTToken{}, nil
}

// CalculateMBTNAV calculates Net Asset Value of MBT basket
func (c *MBTBasketContract) CalculateMBTNAV(ctx contractapi.TransactionContextInterface) (float64, error) {
	holdings, err := c.GetBasketHoldings(ctx)
	if err != nil {
		return 0, err
	}
	
	prices, err := c.GetMBTPrices(ctx)
	if err != nil {
		return 0, err
	}
	
	// Calculate total basket value
	totalValue := holdings.TotalBGTValue*prices["BGT"] + 
		holdings.TotalBSTValue*prices["BST"] + 
		holdings.TotalBPTValue*prices["BPT"]
	
	if holdings.TotalMBTSupply == 0 {
		return 0, nil
	}
	
	// Calculate NAV per MBT token
	nav := totalValue / holdings.TotalMBTSupply
	
	log.Printf("Calculated MBT NAV: %.2f (Total Value: %.2f, Supply: %.2f)", nav, totalValue, holdings.TotalMBTSupply)
	return nav, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(new(MBTBasketContract))
	if err != nil {
		log.Panicf("Error creating MBT basket chaincode: %v", err)
	}

	if err := chaincode.Start(); err != nil {
		log.Panicf("Error starting MBT basket chaincode: %v", err)
	}
}