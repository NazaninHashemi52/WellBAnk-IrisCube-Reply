"""
AI Profile Agent - Phase 2
Generates intelligent customer profile summaries using Claude API
"""

import anthropic
import os
import json
from typing import Dict, Any, Optional

class ProfileSummaryAgent:
    """AI Agent that generates intelligent profile summaries and recommendations"""
    
    def __init__(self, api_key: str = None):
        """
        Initialize the AI agent with Anthropic API key
        
        Args:
            api_key: Anthropic API key (defaults to environment variable)
        """
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError("Anthropic API key not found. Set ANTHROPIC_API_KEY environment variable.")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"
        
    def generate_profile_summary(self, profile: Dict[str, Any]) -> Dict[str, str]:
        """
        Generate comprehensive AI-powered profile summary
        
        Args:
            profile: Complete customer profile dictionary
            
        Returns:
            Dictionary with summary and recommendations
        """
        # Build context prompt
        prompt = self._build_profile_prompt(profile)
        
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                temperature=0.7,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            # Extract text from response
            summary_text = response.content[0].text
            
            # Parse the response into structured format
            return self._parse_summary_response(summary_text)
            
        except Exception as e:
            print(f"Error generating AI summary: {e}")
            return {
                "summary": "Unable to generate AI summary at this time.",
                "cluster_interpretation": "Analysis unavailable.",
            }
    
    def _build_profile_prompt(self, profile: Dict[str, Any]) -> str:
        """Build detailed prompt for Claude"""
        
        # Extract key information
        customer_id = profile.get('customer_id', 'Unknown')
        demographics = profile.get('demographics', {})
        financial = profile.get('financial_metrics', {})
        clusters = profile.get('clusters', {})
        products = profile.get('products', {})
        spending = profile.get('spending_categories', {})
        patterns = profile.get('transaction_patterns', {})
        segment = profile.get('economic_segment', {})
        
        prompt = f"""You are an expert banking analyst specializing in customer profiling and financial advisory.
Analyze this customer profile and provide insights in English.

CUSTOMER PROFILE DATA:
====================

Customer ID: {customer_id}

DEMOGRAPHICS:
- Age Group: {demographics.get('age_group', 'Unknown')}
- Gender: {demographics.get('sex', 'Unknown')}
- Marital Status: {demographics.get('marital_status', 'Unknown')}
- Economic Segment: {segment.get('segment', 'Unknown')}
- Professional Activity: {profile.get('activity', {}).get('activity_description', 'Unknown')}

CLUSTER ASSIGNMENTS:
- Category Cluster: {clusters.get('category_cluster', 'Unknown')}
- Client Type Cluster: {clusters.get('client_cluster', 'Unknown')}
- Time Pattern Cluster: {clusters.get('time_cluster', 'Unknown')}

FINANCIAL BEHAVIOR:
- Average Transaction Amount: €{financial.get('average_transaction_amount', 0):.2f}
- Transaction Frequency: {financial.get('transaction_frequency', 0)} transactions
- Spending Concentration: {financial.get('spending_concentration', 0):.4f}
- Spending Volatility: {financial.get('spending_volatility', 0):.4f}

BANKING PRODUCTS:
- Total Products Owned: {products.get('total_products', 0)}
- Products: {', '.join([p['name'] for p in products.get('product_details', [])])}

SPENDING BEHAVIOR:
- Primary Categories: {', '.join(spending.get('primary_categories', [])[:5])}
- Most Active Day: {patterns.get('most_active_day', 'Unknown')}
- Preferred Time: {patterns.get('most_active_time', 'Unknown')}

CLUSTER INTERPRETATION GUIDE:
=============================

CLIENT TYPE CLUSTERS:
- Cluster 0: "Basic Clients" - Low engagement, minimal products (1-2 products), basic banking needs
- Cluster 1: "Standard Clients" - Moderate engagement, typical product mix (2-4 products), standard banking relationship
- Cluster 2: "Premium Clients" - High engagement, diverse products (4+ products), premium banking needs

CATEGORY CLUSTERS (Spending Patterns):
- Cluster 0: "Essential Spending" - Focus on essential expenses (groceries, utilities)
- Cluster 1: "Digital Lifestyle" - High digital/online spending, entertainment, subscriptions
- Cluster 2: "Family Oriented" - Family-focused spending (childcare, education, home)
- Cluster 3: "Transportation Heavy" - High transportation and mobility costs
- Cluster 4: "Mixed Spending" - Diversified spending across multiple categories
- Cluster 5: "Basic Needs" - Focus on basic necessities, conservative spending

TIME PATTERN CLUSTERS:
- Cluster 0: "Night Hours" - Night-time transactions, irregular schedule
- Cluster 1: "Early Morning" - Early morning activity, structured routine
- Cluster 2: "Active Weekend" - Weekend-focused transactions
- Cluster 3: "Office Hours" - Standard business hours (9-17)
- Cluster 4: "Evening/After Dinner" - Evening transactions (18-23)
- Cluster 5: "Irregular Pattern" - No clear pattern, variable timing

TASK:
=====
Generate a comprehensive customer profile summary in English with TWO sections:

1. **CUSTOMER PROFILE** (2-3 sentences):
   - Describe the customer's demographic profile and economic segment
   - Mention their primary characteristics and lifestyle indicators
   - **IMPORTANT**: If the customer has zero transactions or no product ownership, explicitly state this is "Predictive Prospecting" based on demographic profiling rather than actual behavior
   - Keep it natural and conversational

2. **CLUSTER INTERPRETATION** (2-3 sentences):
   - Explain what their cluster assignments mean in practical terms
   - Connect the clusters to their actual behavior and needs
   - **IMPORTANT**: If there's no transaction data, explain that clusters are based on demographic potential (age, profession, income) rather than past behavior
   - Use the cluster guide above to provide accurate interpretations

FORMAT YOUR RESPONSE AS:
========================

CUSTOMER PROFILE:
[Your customer profile summary in English]

CLUSTER INTERPRETATION:
[Your cluster interpretation in English]

IMPORTANT GUIDELINES:
- Write in professional yet accessible English
- Be specific and data-driven in your analysis
- Focus on actionable insights
- Use the cluster interpretations provided above
- Keep each section concise (2-3 sentences maximum)
"""
        
        return prompt
    
    def _parse_summary_response(self, response_text: str) -> Dict[str, str]:
        """Parse Claude's response into structured sections"""
        
        sections = {
            "summary": "",
            "cluster_interpretation": "",
            "recommendations": ""
        }
        
        # Split by section headers
        text = response_text.strip()

        # Extract Customer Profile (try both English and Italian headers for compatibility)
        if "CUSTOMER PROFILE:" in text:
            parts = text.split("CUSTOMER PROFILE:", 1)
            if len(parts) > 1:
                remainder = parts[1]
                if "CLUSTER INTERPRETATION:" in remainder:
                    sections["summary"] = remainder.split("CLUSTER INTERPRETATION:")[0].strip()
                else:
                    sections["summary"] = remainder.strip()
        elif "PROFILO CLIENTE:" in text:
            parts = text.split("PROFILO CLIENTE:", 1)
            if len(parts) > 1:
                remainder = parts[1]
                if "INTERPRETAZIONE CLUSTER:" in remainder:
                    sections["summary"] = remainder.split("INTERPRETAZIONE CLUSTER:")[0].strip()
                elif "CLUSTER INTERPRETATION:" in remainder:
                    sections["summary"] = remainder.split("CLUSTER INTERPRETATION:")[0].strip()
                else:
                    sections["summary"] = remainder.strip()

        # Extract Cluster Interpretation (try both English and Italian headers for compatibility)
        if "CLUSTER INTERPRETATION:" in text:
            parts = text.split("CLUSTER INTERPRETATION:", 1)
            if len(parts) > 1:
                remainder = parts[1]
                sections["cluster_interpretation"] = remainder.strip()
        elif "INTERPRETAZIONE CLUSTER:" in text:
            parts = text.split("INTERPRETAZIONE CLUSTER:", 1)
            if len(parts) > 1:
                remainder = parts[1]
                sections["cluster_interpretation"] = remainder.strip()
        
        # If parsing failed, return the whole text as summary
        if not sections["summary"]:
            sections["summary"] = text
        
        return sections
    
    def generate_quick_insight(self, profile: Dict[str, Any]) -> str:
        """
        Generate a quick one-paragraph insight for dashboard display

        Args:
            profile: Complete customer profile dictionary

        Returns:
            Single paragraph summary in English
        """
        full_summary = self.generate_profile_summary(profile)

        # Combine all sections into one paragraph
        insight = f"{full_summary['summary']} {full_summary['cluster_interpretation']}"

        return insight

