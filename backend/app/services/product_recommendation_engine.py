"""
Product Recommendation Engine with AI Reasoning
State-of-the-art recommendation system for banking services
Combines market research, customer profiling, and multi-agent analysis
"""

import anthropic
import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.db import get_conn


class ProductRecommendationEngine:
    """
    Comprehensive recommendation engine that generates Top 3 product recommendations
    with AI-powered reasoning, fitness scores, and market alignment.
    Designed for accuracy and responsibility in banking recommendations.
    """
    
    def __init__(self, api_key: str = None):
        """Initialize with Anthropic API key"""
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError("Anthropic API key required. Set ANTHROPIC_API_KEY environment variable.")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"
        
        # Italian banking product catalog - aligned with existing system
        self.product_catalog = self._init_product_catalog()
    
    def _init_product_catalog(self) -> Dict:
        """Initialize comprehensive Italian banking product catalog"""
        return {
            'ASSA566': {
                'name': 'Assicurazione Sanitaria SalusCare',
                'category': 'Insurance',
                'type': 'health_insurance',
                'description': 'Comprehensive health coverage with access to network of affiliated facilities',
                'key_benefits': [
                    'Medical expenses coverage up to €50,000/year',
                    'Specialist visits without waiting lists',
                    '24/7 assistance in Italy and abroad'
                ],
                'target_segments': ['affluent', 'mass_market', 'family_oriented'],
                'min_age': 18,
                'max_age': 75,
                'base_cost': 65
            },
            'CACR432': {
                'name': 'Carta di Credito AureaCard Exclusive',
                'category': 'Credit',
                'type': 'premium_credit_card',
                'description': 'Premium credit card with rewards program and exclusive services',
                'key_benefits': [
                    'Cashback up to 3% on online purchases',
                    'Travel insurance and car rental included',
                    'Free access to airport lounges'
                ],
                'target_segments': ['affluent', 'frequent_travelers', 'high_spenders'],
                'min_income': 25000,
                'base_cost': 0
            },
            'CACR748': {
                'name': 'Carta di Credito AureaCard Infinity',
                'category': 'Credit',
                'type': 'ultra_premium_credit_card',
                'description': 'Ultra premium credit card with concierge service and exclusive benefits',
                'key_benefits': [
                    'Personalized 24/7 concierge service',
                    '5% cashback on all categories',
                    'Unlimited Priority Pass + guests'
                ],
                'target_segments': ['affluent', 'premium_clients'],
                'min_income': 50000,
                'base_cost': 150
            },
            'CADB439': {
                'name': 'Carta di Debito ZynaFlow Plus',
                'category': 'Credit',
                'type': 'premium_debit_card',
                'description': 'Contactless debit card with cashback and smart expense management',
                'key_benefits': [
                    '1% cashback on all purchases',
                    'Real-time notifications for every transaction',
                    'Automatic spending categories for budgeting'
                ],
                'target_segments': ['young_professionals', 'digital_natives', 'mass_market'],
                'base_cost': 0
            },
            'CADB783': {
                'name': 'Carta di Debito EasyYoung Pay',
                'category': 'Credit',
                'type': 'youth_debit_card',
                'description': 'Card dedicated to young people with advanced mobile app and gamification',
                'key_benefits': [
                    'Mobile app with gamified budget management',
                    'Free withdrawals throughout Europe',
                    'Exclusive discounts on youth brands'
                ],
                'target_segments': ['students', 'young_adults'],
                'min_age': 18,
                'max_age': 30,
                'base_cost': 0
            },
            'CAPR574': {
                'name': 'Carta Prepagata FlexPay One',
                'category': 'Credit',
                'type': 'prepaid_card',
                'description': 'Rechargeable prepaid card for expense control and secure online shopping',
                'key_benefits': [
                    'Total expense control with preset limit',
                    'Ideal for secure online shopping',
                    'Instant recharge from mobile app'
                ],
                'target_segments': ['budget_conscious', 'online_shoppers', 'students'],
                'base_cost': 5
            },
            'CCOR602': {
                'name': 'Conto Corrente MyEnergy',
                'category': 'Accounts',
                'type': 'checking_account',
                'description': 'Zero-fee checking account with advanced digital services',
                'key_benefits': [
                    'Zero management fees with salary deposit',
                    'Unlimited free instant transfers',
                    'Award-winning mobile app with AI assistant'
                ],
                'target_segments': ['employees', 'mass_market', 'digital_natives'],
                'base_cost': 0
            },
            'CINV819': {
                'name': 'Conto Investimento SharesVault',
                'category': 'Investments',
                'type': 'investment_account',
                'description': 'Investment platform with robo-advisor and personalized portfolio',
                'key_benefits': [
                    'Robo-advisor with automatic rebalancing',
                    'ETFs and index funds with reduced fees',
                    'Financial advisory included in subscription'
                ],
                'target_segments': ['affluent', 'investors', 'wealth_builders'],
                'min_investment': 5000,
                'base_cost': 20
            },
            'CRDT356': {
                'name': 'Linea di Credito FlexiCredit',
                'category': 'Credit',
                'type': 'credit_line',
                'description': 'Revolving credit line for unexpected expenses and opportunities',
                'key_benefits': [
                    'Flexible usage up to €15,000',
                    'Interest only on amount used',
                    'Fast approval within 24 hours'
                ],
                'target_segments': ['mass_market', 'entrepreneurs', 'families'],
                'min_income': 15000,
                'base_cost': 0
            },
            'DPAM682': {
                'name': 'Deposito Gestito WealthPlus',
                'category': 'Savings',
                'type': 'managed_deposit',
                'description': 'Term deposit with active management to maximize returns',
                'key_benefits': [
                    'Guaranteed minimum return 2.5% annually',
                    'Active management by certified experts',
                    'Partial liquidity without penalties'
                ],
                'target_segments': ['affluent', 'conservative_investors', 'retirees'],
                'min_deposit': 10000,
                'base_cost': 0
            },
            'DPAM997': {
                'name': 'Deposito Premium SafeHarbor',
                'category': 'Savings',
                'type': 'premium_deposit',
                'description': 'Premium deposit with competitive rate and wealth management services',
                'key_benefits': [
                    'Fixed rate 3.2% for 12 months',
                    'Dedicated wealth management advisory',
                    'Protection up to €250,000 (FITD)'
                ],
                'target_segments': ['affluent', 'high_net_worth'],
                'min_deposit': 50000,
                'base_cost': 0
            },
            'DPRI866': {
                'name': 'Deposito Smart SaveSmart',
                'category': 'Savings',
                'type': 'smart_deposit',
                'description': 'Smart deposit with variable rate linked to savings goals',
                'key_benefits': [
                    'Progressive rate: more you save, more you earn',
                    'Goal-based saving with milestone rewards',
                    'No duration commitment'
                ],
                'target_segments': ['young_professionals', 'savers', 'goal_oriented'],
                'min_deposit': 1000,
                'base_cost': 0
            },
            'FPEN541': {
                'name': 'Fondo Pensione FutureSecure',
                'category': 'Investments',
                'type': 'pension_fund',
                'description': 'Supplementary pension plan with tax benefits and flexibility',
                'key_benefits': [
                    'Tax deductibility up to €5,164/year',
                    'Sustainable ESG portfolio',
                    'Historical average return 4.5%'
                ],
                'target_segments': ['employees', 'self_employed', 'long_term_planners'],
                'min_contribution': 1200,
                'base_cost': 25
            },
            'MTUU356': {
                'name': 'Mutuo Casa DreamHome',
                'category': 'Loans',
                'type': 'mortgage',
                'description': 'First home mortgage with subsidized rate and personalized consulting',
                'key_benefits': [
                    'Fixed APR from 2.95% (first home)',
                    'Up to 80% of property value',
                    'Free processing and appraisal included'
                ],
                'target_segments': ['first_home_buyers', 'families', 'young_couples'],
                'max_ltv': 80,
                'base_cost': 0
            },
            'PARK443': {
                'name': 'Servizio Parcheggio SmartPark',
                'category': 'Services',
                'type': 'parking_service',
                'description': 'Affiliated parking subscription with automatic payment',
                'key_benefits': [
                    'Access to 500+ parking lots in Italy',
                    'Contactless automatic payment',
                    '20% discount on hourly rates'
                ],
                'target_segments': ['commuters', 'urban_dwellers', 'car_owners'],
                'base_cost': 15
            },
            'PLZZ334': {
                'name': 'Prestito Personale QuickCash',
                'category': 'Loans',
                'type': 'personal_loan',
                'description': 'Personal loan with fast approval and flexible installments',
                'key_benefits': [
                    'Approval within 2 business hours',
                    'APR from 4.95%, plans from 12 to 84 months',
                    'No penalty for early repayment'
                ],
                'target_segments': ['mass_market', 'project_financers'],
                'min_income': 12000,
                'max_amount': 50000,
                'base_cost': 0
            },
            'PRPE078': {
                'name': 'Pacchetto Premium LifeStyle',
                'category': 'Packages',
                'type': 'premium_package',
                'description': 'Complete package with all integrated premium banking services',
                'key_benefits': [
                    'All premium products at discounted price',
                    'Dedicated personal banker',
                    'Exclusive events and networking'
                ],
                'target_segments': ['affluent', 'premium_clients'],
                'min_relationship_value': 100000,
                'base_cost': 50
            },
            'PRPE771': {
                'name': 'Pacchetto Premium Business+',
                'category': 'Packages',
                'type': 'business_package',
                'description': 'Integrated solution for professionals and small businesses',
                'key_benefits': [
                    'Business account + corporate credit card',
                    'Free POS terminal with reduced fees',
                    'Integrated management software'
                ],
                'target_segments': ['entrepreneurs', 'small_business', 'professionals'],
                'base_cost': 35
            },
            'SINV263': {
                'name': 'Servizio Investimento PlannerPro',
                'category': 'Investments',
                'type': 'investment_service',
                'description': 'Personalized financial advisory with wealth planning',
                'key_benefits': [
                    'Dedicated certified financial advisor',
                    'Annual personalized financial plan',
                    'Quarterly monitoring and rebalancing'
                ],
                'target_segments': ['affluent', 'wealth_builders', 'investors'],
                'min_portfolio': 25000,
                'base_cost': 100
            },
            # Map existing generic codes to specific products
            'BASIC_CHECKING': {
                'name': 'Daily Flow Account',
                'category': 'Accounts',
                'type': 'checking_account',
                'description': 'Enhanced checking account with simplified financial management',
                'key_benefits': [
                    'Low monthly fees',
                    'Easy online banking',
                    'Free ATM withdrawals'
                ],
                'target_segments': ['mass_market', 'basic_users'],
                'base_cost': 0
            },
            'PREMIUM_INVESTMENT': {
                'name': 'Premium Investment Portfolio',
                'category': 'Investments',
                'type': 'investment_portfolio',
                'description': 'Premium investment portfolio with diversified assets',
                'key_benefits': [
                    'Diversified portfolio management',
                    'Professional financial advisory',
                    'Tax-optimized strategies'
                ],
                'target_segments': ['affluent', 'high_net_worth'],
                'min_investment': 50000,
                'base_cost': 100
            },
            'WEALTH_MANAGEMENT': {
                'name': 'Wealth Management Service',
                'category': 'Investments',
                'type': 'wealth_management',
                'description': 'Comprehensive wealth management with dedicated advisor',
                'key_benefits': [
                    'Personal wealth advisor',
                    'Customized investment strategy',
                    'Estate planning services'
                ],
                'target_segments': ['affluent', 'high_net_worth'],
                'min_portfolio': 100000,
                'base_cost': 200
            },
            'REWARDS_CREDIT': {
                'name': 'Rewards Credit Card',
                'category': 'Credit',
                'type': 'rewards_credit_card',
                'description': 'Credit card with cashback and rewards program',
                'key_benefits': [
                    'Cashback on purchases',
                    'Travel rewards',
                    'Purchase protection'
                ],
                'target_segments': ['mass_market', 'frequent_spenders'],
                'base_cost': 0
            },
            'PERSONAL_LOAN': {
                'name': 'Personal Loan',
                'category': 'Loans',
                'type': 'personal_loan',
                'description': 'Flexible personal loan for various needs',
                'key_benefits': [
                    'Competitive interest rates',
                    'Flexible repayment terms',
                    'Fast approval process'
                ],
                'target_segments': ['mass_market', 'families'],
                'min_income': 15000,
                'base_cost': 0
            },
            'SAVINGS_PLAN': {
                'name': 'Savings Plan',
                'category': 'Savings',
                'type': 'savings_plan',
                'description': 'Structured savings plan with goal tracking',
                'key_benefits': [
                    'Automated savings',
                    'Goal-based planning',
                    'Competitive interest rates'
                ],
                'target_segments': ['young_professionals', 'savers'],
                'base_cost': 0
            },
            'BUSINESS_ACCOUNT': {
                'name': 'Business Account',
                'category': 'Accounts',
                'type': 'business_account',
                'description': 'Business banking account with professional services',
                'key_benefits': [
                    'Business transaction management',
                    'Multi-user access',
                    'Integrated accounting tools'
                ],
                'target_segments': ['entrepreneurs', 'small_business'],
                'base_cost': 25
            },
            'MORTGAGE': {
                'name': 'Mortgage Loan',
                'category': 'Loans',
                'type': 'mortgage',
                'description': 'Home mortgage with competitive rates',
                'key_benefits': [
                    'Competitive interest rates',
                    'Flexible terms',
                    'Expert guidance'
                ],
                'target_segments': ['families', 'home_buyers'],
                'base_cost': 0
            }
        }
    
    def validate_customer_profile(self, profile: Dict[str, Any]) -> tuple:
        """
        Validate customer profile data before generating recommendations.
        Ensures data accuracy and prevents errors.
        """
        required_fields = ['customer_id']
        for field in required_fields:
            if field not in profile or not profile[field]:
                return False, f"Missing required field: {field}"
        
        # Validate demographics
        demographics = profile.get('demographics', {})
        if demographics:
            age_group = demographics.get('age_group', '')
            if age_group and not isinstance(age_group, str):
                return False, "Invalid age_group format"
        
        # Validate financial metrics
        financial = profile.get('financial_metrics', {})
        if financial:
            for key in ['average_transaction_amount', 'transaction_frequency']:
                if key in financial:
                    value = financial[key]
                    if not isinstance(value, (int, float)) or value < 0:
                        return False, f"Invalid {key}: must be non-negative number"
        
        # Validate clusters
        clusters = profile.get('clusters', {})
        if clusters:
            for cluster_type in ['category_cluster', 'client_cluster', 'time_cluster']:
                if cluster_type in clusters:
                    value = clusters[cluster_type]
                    if value is not None and not isinstance(value, (int, type(None))):
                        return False, f"Invalid {cluster_type}: must be integer or None"
        
        return True, None
    
    def filter_eligible_products(
        self,
        available_products: Dict,
        customer_profile: Dict[str, Any]
    ) -> Dict:
        """
        Filter products based on eligibility criteria.
        Ensures only appropriate products are recommended.
        Prioritizes business products for business owners.
        """
        eligible = {}
        demographics = customer_profile.get('demographics', {})
        financial = customer_profile.get('financial_metrics', {})
        segment = customer_profile.get('economic_segment', {}).get('segment', '').lower()
        annual_income = customer_profile.get('economic_segment', {}).get('annual_income', 0) or 0
        activity = customer_profile.get('activity', {}).get('activity_description', 'Unknown')
        
        # Detect business owner
        is_business_owner = False
        business_indicators = [
            'manufacturing', 'repair', 'owner', 'entrepreneur', 'business', 
            'self-employed', 'professional', 'consultant', 'freelance', 
            'artisan', 'craftsman', 'trader', 'merchant', 'retailer',
            'industrial', 'commercial', 'corporate', 'firm', 'company',
            'SB', 'small_business', 'small business'
        ]
        
        activity_lower = str(activity).lower()
        if any(indicator in activity_lower for indicator in business_indicators):
            is_business_owner = True
        if 'sb' in segment.lower() or 'small_business' in segment.lower():
            is_business_owner = True
        
        # Calculate age from age_group if available
        age = None
        age_group = demographics.get('age_group', '')
        if age_group:
            if 'Under 30' in age_group:
                age = 25
            elif '30-45' in age_group:
                age = 37
            elif '45-60' in age_group:
                age = 52
            elif '60+' in age_group:
                age = 65
        
        for code, product in available_products.items():
            is_eligible = True
            reasons = []
            
            # Age restrictions
            if 'min_age' in product and age is not None:
                if age < product['min_age']:
                    is_eligible = False
                    reasons.append(f"Customer age {age} below minimum {product['min_age']}")
            
            if 'max_age' in product and age is not None:
                if age > product['max_age']:
                    is_eligible = False
                    reasons.append(f"Customer age {age} above maximum {product['max_age']}")
            
            # Income restrictions
            if 'min_income' in product:
                if annual_income < product['min_income']:
                    is_eligible = False
                    reasons.append(f"Income {annual_income} below minimum {product['min_income']}")
            
            # Segment restrictions
            if 'target_segments' in product:
                target_segments = [s.lower() for s in product['target_segments']]
                segment_match = False
                if segment:
                    segment_match = any(target in segment or segment in target for target in target_segments)
                
                # BUSINESS LOGIC: Boost business products for business owners
                if is_business_owner:
                    business_segments = ['entrepreneurs', 'small_business', 'professionals', 'business']
                    product_is_business = any(bs in target_segments for bs in business_segments)
                    product_is_consumer = any(seg in ['employees', 'mass_market', 'digital_natives'] for seg in target_segments)
                    
                    # If product is business-focused, always include for business owners
                    if product_is_business:
                        segment_match = True  # Force inclusion
                    # If product is consumer-focused and we have business alternatives, lower priority (but don't exclude)
                    elif product_is_consumer and not segment_match:
                        # Still include but will be deprioritized in AI reasoning
                        pass
                
                # If no segment match and product has strict targeting, exclude
                if not segment_match and len(target_segments) < 5:  # Allow if broadly targeted
                    # Don't exclude, but note it
                    pass
            
            if is_eligible:
                eligible[code] = product
        
        return eligible
    
    def generate_recommendations(
        self,
        customer_profile: Dict[str, Any],
        include_market_research: bool = False  # Disabled by default for accuracy
    ) -> Dict[str, Any]:
        """
        Generate Top 3 product recommendations with AI reasoning.
        Includes comprehensive validation and error handling.
        
        Args:
            customer_profile: Complete customer profile data
            include_market_research: Whether to include web search (disabled for accuracy)
            
        Returns:
            Dictionary with recommendations, scores, and reasoning
        """
        
        # Validate customer profile first
        is_valid, error_msg = self.validate_customer_profile(customer_profile)
        if not is_valid:
            return {
                "error": f"Invalid customer profile: {error_msg}",
                "recommendations": [],
                "validation_failed": True
            }
        
        # Get products customer doesn't own
        owned_products = customer_profile.get('products', {}).get('owned_products', [])
        if not isinstance(owned_products, list):
            owned_products = []
        
        available_products = {
            code: details for code, details in self.product_catalog.items()
            if code not in owned_products
        }
        
        if not available_products:
            return {
                "error": "Customer already owns all available products",
                "recommendations": [],
                "customer_id": customer_profile.get('customer_id')
            }
        
        # Filter by eligibility
        eligible_products = self.filter_eligible_products(available_products, customer_profile)
        
        if not eligible_products:
            return {
                "error": "No eligible products found for this customer profile",
                "recommendations": [],
                "customer_id": customer_profile.get('customer_id')
            }
        
        # Limit to top 10 products to avoid token overflow
        eligible_products = dict(list(eligible_products.items())[:10])
        
        # Build comprehensive prompt for Claude
        prompt = self._build_recommendation_prompt(
            customer_profile,
            eligible_products,
            include_market_research
        )
        
        try:
            # Call Claude API
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                temperature=0.7,  # Balanced creativity and consistency
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            # Parse response
            recommendations = self._parse_recommendations_response(response, eligible_products)
            
            # Validate recommendations before returning
            validated_recs = self._validate_recommendations(recommendations, eligible_products)
            
            # Add timestamp and metadata
            validated_recs['timestamp'] = datetime.now().isoformat()
            validated_recs['customer_id'] = customer_profile.get('customer_id')
            validated_recs['market_research_included'] = include_market_research
            validated_recs['total_eligible_products'] = len(eligible_products)
            
            return validated_recs
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error generating recommendations: {e}")
            print(error_trace)
            return {
                "error": f"Error generating recommendations: {str(e)}",
                "recommendations": [],
                "fallback": True
            }
    
    def _build_recommendation_prompt(
        self,
        customer_profile: Dict,
        available_products: Dict,
        include_market_research: bool
    ) -> str:
        """Build comprehensive prompt for recommendation generation"""
        
        # Extract key customer info with safe defaults
        demographics = customer_profile.get('demographics', {})
        financial = customer_profile.get('financial_metrics', {})
        clusters = customer_profile.get('clusters', {})
        spending = customer_profile.get('spending_categories', {})
        patterns = customer_profile.get('transaction_patterns', {})
        segment = customer_profile.get('economic_segment', {}).get('segment', 'Unknown')
        activity = customer_profile.get('activity', {}).get('activity_description', 'Unknown')
        annual_income = customer_profile.get('economic_segment', {}).get('annual_income', 0) or 0
        
        # Detect if customer is a business owner/entrepreneur
        is_business_owner = False
        business_indicators = [
            'manufacturing', 'repair', 'owner', 'entrepreneur', 'business', 
            'self-employed', 'professional', 'consultant', 'freelance', 
            'artisan', 'craftsman', 'trader', 'merchant', 'retailer',
            'industrial', 'commercial', 'corporate', 'firm', 'company',
            'SB', 'small_business', 'small business'  # Segment hints
        ]
        
        activity_lower = str(activity).lower()
        segment_lower = str(segment).lower()
        
        # Check profession/activity description
        if any(indicator in activity_lower for indicator in business_indicators):
            is_business_owner = True
        
        # Check economic segment (SB = Small Business)
        if 'sb' in segment_lower or 'small_business' in segment_lower or 'small business' in segment_lower:
            is_business_owner = True
        
        # Check if profession field indicates business
        profession = customer_profile.get('activity', {}).get('profession', '') or ''
        profession_lower = str(profession).lower()
        if any(indicator in profession_lower for indicator in business_indicators):
            is_business_owner = True
        
        # Build product list
        products_text = "\n\n".join([
            f"**{code}**: {details['name']}\n"
            f"- Category: {details['category']}\n"
            f"- Type: {details['type']}\n"
            f"- Description: {details['description']}\n"
            f"- Key Benefits: {', '.join(details.get('key_benefits', []))}\n"
            f"- Target Segments: {', '.join(details.get('target_segments', []))}"
            for code, details in available_products.items()
        ])
        
        prompt = f"""You are an expert financial advisor specializing in the Italian banking market. Your task is to generate precise, accurate, and responsible product recommendations.

**CUSTOMER PROFILE:**
- Customer ID: {customer_profile.get('customer_id', 'Unknown')}
- Age Group: {demographics.get('age_group', 'Unknown')}
- Gender: {demographics.get('sex', 'Unknown')}
- Marital Status: {demographics.get('marital_status', 'Unknown')}
- Economic Segment: {segment}
- Annual Income: €{annual_income:,.0f} (if available)
- Professional Activity: {activity}

**CLUSTER ASSIGNMENT:**
- Category Cluster: {clusters.get('category_cluster', 'Unknown')} (spending pattern)
- Client Cluster: {clusters.get('client_cluster', 'Unknown')} (engagement type)
- Time Cluster: {clusters.get('time_cluster', 'Unknown')} (transaction timing)

**FINANCIAL BEHAVIOR:**
- Average Transaction Amount: €{financial.get('average_transaction_amount', 0):.2f}
- Transaction Frequency: {financial.get('transaction_frequency', 0)} transactions
- Spending Concentration: {financial.get('spending_concentration', 0):.4f}
- Volatility: {financial.get('spending_volatility', 0):.4f}

**SPENDING PATTERNS:**
- Primary Categories: {', '.join(spending.get('primary_categories', [])[:5]) if spending.get('primary_categories') else 'Unknown'}
- Most Active Day: {patterns.get('most_active_day', 'Unknown')}
- Preferred Time: {patterns.get('most_active_time', 'Unknown')}

**PRODUCTS ALREADY OWNED:**
{', '.join(customer_profile.get('products', {}).get('owned_products', [])) or 'None'}

**AVAILABLE PRODUCTS TO RECOMMEND:**
{products_text}

---

**TASK**: Generate exactly TOP 3 product recommendations in valid JSON format.

{f'''
**STRATEGIC BUSINESS LOGIC RULE (CRITICAL):**
This customer is identified as a BUSINESS OWNER/ENTREPRENEUR based on their profession/activity: "{activity}" and segment: "{segment}".

YOU MUST PRIORITIZE BUSINESS PRODUCTS:
- If products like "BUSINESS_ACCOUNT" or "PRPE771" (Pacchetto Premium Business+) are available, they MUST be ranked in the TOP 3 recommendations
- Business accounts should be prioritized over consumer checking accounts (e.g., CCOR602 MyEnergy) for business owners
- When recommending business products, emphasize BUSINESS-SPECIFIC benefits in your reasoning:
  * Cash flow management and working capital
  * POS terminals and payment processing
  * VAT handling and tax management
  * Multi-user access and team management
  * Integrated accounting tools
  * Business transaction management
  * Corporate credit cards for business expenses
- Consumer accounts (targeted at "employees", "mass_market", "digital_natives") should NOT be recommended to business owners unless no business products are available
- Expected revenue from business accounts is typically higher (€25-€35/month) than free consumer accounts

This rule ensures PROFESSIONAL ACCURACY and INCREASED REVENUE for the bank.

''' if is_business_owner else ''}

**CRITICAL REQUIREMENTS FOR ACCURACY:**
1. **Only recommend products from the available list above**
2. **Fitness scores must be realistic** (0-100%, based on actual fit)
3. **All product codes must exist in the catalog**
4. **Reasoning must be specific and data-driven**
5. **No generic or vague statements**
6. **Compliance**: No guarantees, promises, or misleading claims
7. **Business Logic**: {f'STRICTLY prioritize business products (BUSINESS_ACCOUNT, PRPE771) over consumer accounts for this business owner.' if is_business_owner else 'Standard recommendation logic applies.'}

**OUTPUT FORMAT** (Valid JSON only):
```json
{{
  "recommendations": [
    {{
      "rank": 1,
      "product_code": "EXACT_CODE_FROM_LIST",
      "product_name": "Exact Product Name",
      "category": "Category",
      "fitness_score": 85,
      "confidence_level": "High",
      "key_benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "short_reasoning": "2-3 sentence explanation",
      "detailed_reasoning": "Complete 5-8 sentence analysis covering: cluster alignment, financial behavior match, customer needs, expected impact",
      "triggers_used": ["TRIGGER_1", "TRIGGER_2"],
      "expected_monthly_value": 150.00,
      "acceptance_probability": 0.75
    }},
    {{
      "rank": 2,
      ...
    }},
    {{
      "rank": 3,
      ...
    }}
  ],
  "recommendation_strategy": "Brief strategy explanation"
}}
```

**VALIDATION RULES:**
- product_code MUST match exactly one from available products
- fitness_score must be between 0-100
- acceptance_probability must be between 0.0-1.0
- All reasoning must reference specific customer data
- No fabricated data or made-up statistics

Generate the recommendations now:"""
        
        return prompt
    
    def _parse_recommendations_response(self, response, eligible_products: Dict) -> Dict:
        """Parse Claude's recommendation response with validation"""
        
        result = {
            "recommendations": [],
            "recommendation_strategy": "",
            "parse_success": False
        }
        
        # Extract text from all content blocks
        full_text = ""
        for block in response.content:
            if block.type == "text":
                full_text += block.text + "\n"
        
        # Try to parse JSON from response
        try:
            # Look for JSON code block
            if "```json" in full_text:
                json_start = full_text.find("```json") + 7
                json_end = full_text.find("```", json_start)
                json_text = full_text[json_start:json_end].strip()
            elif "```" in full_text:
                json_start = full_text.find("```") + 3
                json_end = full_text.find("```", json_start)
                json_text = full_text[json_start:json_end].strip()
            else:
                # Try to find JSON directly
                json_start = full_text.find("{")
                json_end = full_text.rfind("}") + 1
                json_text = full_text[json_start:json_end]
            
            parsed = json.loads(json_text)
            
            # Validate and structure
            if "recommendations" in parsed:
                recs = parsed["recommendations"][:3]  # Top 3 only
                
                # Validate each recommendation
                validated_recs = []
                for rec in recs:
                    product_code = rec.get("product_code", "")
                    
                    # Verify product exists in eligible list
                    if product_code in eligible_products:
                        # Ensure all required fields
                        validated_rec = {
                            "rank": rec.get("rank", len(validated_recs) + 1),
                            "product_code": product_code,
                            "product_name": rec.get("product_name", eligible_products[product_code]['name']),
                            "category": rec.get("category", eligible_products[product_code]['category']),
                            "fitness_score": max(0, min(100, int(rec.get("fitness_score", 50)))),
                            "confidence_level": rec.get("confidence_level", "Medium"),
                            "key_benefits": rec.get("key_benefits", eligible_products[product_code].get('key_benefits', []))[:3],
                            "short_reasoning": rec.get("short_reasoning", ""),
                            "detailed_reasoning": rec.get("detailed_reasoning", ""),
                            "triggers_used": rec.get("triggers_used", []),
                            "expected_monthly_value": max(0, float(rec.get("expected_monthly_value", 0))),
                            "acceptance_probability": max(0.0, min(1.0, float(rec.get("acceptance_probability", 0.5))))
                        }
                        validated_recs.append(validated_rec)
                
                result["recommendations"] = validated_recs
                result["recommendation_strategy"] = parsed.get("recommendation_strategy", "")
                result["parse_success"] = True
            else:
                result["parse_success"] = False
                result["error"] = "No recommendations found in response"
                result["raw_response"] = full_text
            
        except json.JSONDecodeError as e:
            print(f"Warning: Could not parse JSON response: {e}")
            result["parse_success"] = False
            result["raw_response"] = full_text
            result["error"] = "Failed to parse recommendations JSON"
        except Exception as e:
            print(f"Error parsing recommendations: {e}")
            result["parse_success"] = False
            result["error"] = str(e)
        
        return result
    
    def _validate_recommendations(self, recommendations: Dict, eligible_products: Dict) -> Dict:
        """Final validation of recommendations before returning"""
        
        if not recommendations.get("parse_success"):
            return recommendations
        
        validated_recs = []
        for rec in recommendations.get("recommendations", []):
            product_code = rec.get("product_code")
            
            # Double-check product exists
            if product_code and product_code in eligible_products:
                # Ensure all numeric values are valid
                rec["fitness_score"] = max(0, min(100, int(rec.get("fitness_score", 50))))
                rec["acceptance_probability"] = max(0.0, min(1.0, float(rec.get("acceptance_probability", 0.5))))
                rec["expected_monthly_value"] = max(0.0, float(rec.get("expected_monthly_value", 0)))
                
                validated_recs.append(rec)
        
        recommendations["recommendations"] = validated_recs[:3]  # Ensure max 3
        recommendations["total_recommendations"] = len(validated_recs)
        
        return recommendations

