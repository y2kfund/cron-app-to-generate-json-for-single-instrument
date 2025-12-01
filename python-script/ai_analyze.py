"""
Python AI Analysis Function for Batch Stock Processing
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path='../.env')


class AIAnalyzer:
    """AI Analysis handler with OpenRouter API integration and Supabase storage"""
    
    def __init__(
        self, 
        api_key: Optional[str] = None,
        supabase_url: Optional[str] = None,
        supabase_service_key: Optional[str] = None,
        schema: str = 'hf'
    ):
        """Initialize with API keys from parameters or environment"""
        self.api_key = api_key or os.environ.get('OPENROUTER_API_KEY')
        self.supabase_url = (supabase_url or os.environ.get('SUPABASE_URL')).rstrip('/')
        self.supabase_service_key = supabase_service_key or os.environ.get('SUPABASE_SERVICE_KEY')
        self.schema = schema
        
        if not self.api_key:
            raise ValueError('OPENROUTER_API_KEY is required')
        if not self.supabase_url:
            raise ValueError('SUPABASE_URL is required')
        if not self.supabase_service_key:
            raise ValueError('SUPABASE_SERVICE_KEY is required')
        
        # Build base headers for Supabase requests
        self.supabase_headers = {
            'apikey': self.supabase_service_key,
            'Authorization': f'Bearer {self.supabase_service_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            'Accept-Profile': self.schema,
            'Content-Profile': self.schema,
        }
        
        print(f"[AI Analyzer] Initialized with Supabase URL: {self.supabase_url}, schema: {self.schema}")
    
    def fetch_stock_symbols(self) -> List[str]:
        """
        Fetch stock symbols from Supabase positions table
        Mimics the logic from stocksService.ts
        """
        print("[AI Analyzer] Fetching stock symbols from Supabase...")
        
        # Step 1: Get the latest fetched_at timestamp
        url = f"{self.supabase_url}/rest/v1/positions"
        
        params = {
            'select': 'fetched_at',
            'order': 'fetched_at.desc',
            'limit': '1'
        }
        
        response = requests.get(url, headers=self.supabase_headers, params=params)
        response.raise_for_status()
        
        latest_data = response.json()
        if not latest_data:
            print("[AI Analyzer] No positions found in database")
            return []
        
        last_fetched_at = latest_data[0]['fetched_at']
        print(f"[AI Analyzer] Latest fetched_at: {last_fetched_at}")
        
        # Step 2: Fetch stock symbols for that timestamp
        params = {
            'select': 'symbol',
            'asset_class': 'eq.STK',
            'fetched_at': f'eq.{last_fetched_at}'
        }
        
        response = requests.get(url, headers=self.supabase_headers, params=params)
        response.raise_for_status()
        
        positions = response.json()
        symbols = list(set(pos['symbol'] for pos in positions))
        
        print(f"[AI Analyzer] Found {len(symbols)} unique stock symbols: {symbols}")
        return symbols
    
    def load_json_file(self, symbol: str, output_dir: str = '../output') -> Dict[str, Any]:
        """Load JSON file for a given stock symbol"""
        json_path = Path(output_dir) / f"{symbol}.json"
        
        if not json_path.exists():
            raise FileNotFoundError(f"JSON file not found: {json_path}")
        
        with open(json_path, 'r') as f:
            return json.load(f)
    
    def build_system_prompt_for_json(self) -> str:
        """Build system prompt for JSON-based analysis"""
        current_date = datetime.now().strftime('%Y-%m-%d')
        
        return f"""You are an expert financial advisor and options trading analyst with deep expertise in risk management and portfolio optimization.

Current date: {current_date}

You are analyzing position data provided in JSON format. The data includes:
- Stock positions with current market prices
- Call option positions (short calls used for covered call strategies)
- Put option positions (if any)
- Total capital usage and P&L metrics

When analyzing the JSON data, you MUST:

## Risk Assessment Framework
- Use color-coded risk indicators: 🔴 HIGH RISK | 🟡 MODERATE RISK | 🟢 LOW RISK
- Evaluate time decay (Theta) impact on option positions
- Consider implied volatility and upcoming events
- Assess assignment risk for short call positions
- Calculate potential max loss scenarios
- Analyze the covered call strategy effectiveness

## Analysis Structure
1. **Overall Position Health**
   - Stock position summary (quantity, avg price, current P&L)
   - Total capital deployed vs current market value
   - Unrealized P&L analysis

2. **Options Strategy Analysis**
   - Call positions (strike prices, expiration dates, delta)
   - Premium collected vs current market value
   - Assignment risk assessment
   - Roll opportunities

3. **Key Risk Factors**
   - Days to expiration and theta decay
   - Strike price vs current stock price (moneyness)
   - Position-specific risks

4. **Action Items**
   - Immediate actions required (next 24-48 hours)
   - Weekly monitoring items
   - Recommendations: HOLD | CLOSE | ROLL | ADJUST

## Formatting Guidelines
- Use **bold** for emphasis
- Use emojis for visual clarity (🔴🟡🟢 for risk, ✅❌⚠️ for actions)
- Create tables for multi-position comparisons
- Provide specific numeric targets and dates
- Include reasoning for each recommendation

Be direct, actionable, and data-driven. Focus on the specific data provided in the JSON."""
    
    def build_messages_for_json(
        self,
        json_data: Dict[str, Any],
        symbol: str,
        question: str = "Analyze this position data and provide recommendations."
    ) -> List[Dict[str, Any]]:
        """Build messages array for AI request with JSON data"""
        
        # Format JSON data for better readability
        formatted_json = json.dumps(json_data, indent=2)
        
        messages = [
            {
                'role': 'system',
                'content': self.build_system_prompt_for_json()
            },
            {
                'role': 'user',
                'content': f"""**Stock Symbol:** {symbol}
**Analysis Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Request Type:** Automated Daily Analysis

{question}

**Position Data:**
```json
{formatted_json}
```

Please provide a comprehensive analysis of this position including risk assessment, strategy evaluation, and specific action items."""
            }
        ]
        
        return messages
    
    def call_openrouter(self, messages: List[Dict[str, Any]]) -> tuple[Dict[str, Any], Dict[str, Any]]:
        """Make API call to OpenRouter"""
        payload = {
            'model': 'anthropic/claude-sonnet-4.5',
            'messages': messages,
            'max_tokens': 4096,
            'temperature': 0.7,
            'top_p': 1.0,
            'top_k': 0
        }
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://www.y2k.fund',
            'X-Title': 'Y2K Fund - Automated Daily Analysis'
        }
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=120
        )
        
        if not response.ok:
            error_data = {}
            try:
                error_data = response.json()
            except:
                pass
            
            error_message = error_data.get('error', {}).get('message', 'Failed to get AI response')
            raise Exception(f"OpenRouter API error: {error_message}")
        
        return response.json(), payload
    
    def save_to_supabase(
        self,
        user_id: str,
        symbol_root: str,
        question: str,
        ai_response: str,
        model: str,
        json_data: Dict[str, Any],
        api_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Save conversation to Supabase ai_recommendations_conversations table"""
        
        url = f"{self.supabase_url}/rest/v1/ai_recommendations_conversations"
        
        page_url = f"https://www.y2k.fund/instrument-details/{symbol_root}"
        
        payload = {
            'user_id': user_id,
            'symbol_root': symbol_root,
            'question': question,
            'ai_response': ai_response,
            'model': model,
            'page_url': page_url,
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'automated': True,
                'analysis_type': 'daily_json_batch',
                'position_data': json_data,
                'api_payload': api_payload
            }
        }
        
        response = requests.post(url, headers=self.supabase_headers, json=payload)
        response.raise_for_status()
        
        saved = response.json()
        if isinstance(saved, list):
            saved = saved[0]
        
        return saved
    
    def analyze_stock(
        self,
        symbol: str,
        user_id: str,
        output_dir: str = '../output',
        question: str = "Analyze this position data and provide comprehensive recommendations."
    ) -> Dict[str, Any]:
        """
        Analyze a single stock symbol
        
        Args:
            symbol: Stock symbol (e.g., 'META', 'COIN')
            user_id: User ID for database storage
            output_dir: Directory containing JSON files
            question: Analysis question
        
        Returns:
            Dictionary with response and metadata
        """
        print(f"\n{'='*80}")
        print(f"[AI Analyzer] Processing symbol: {symbol}")
        print(f"{'='*80}")
        
        try:
            # Load JSON data
            json_data = self.load_json_file(symbol, output_dir)
            print(f"[AI Analyzer] Loaded JSON data for {symbol}")
            
            # Build messages
            messages = self.build_messages_for_json(json_data, symbol, question)
            
            # Call OpenRouter API
            print(f"[AI Analyzer] Sending request to OpenRouter API...")
            raw_response, sent_payload = self.call_openrouter(messages)
            
            # Extract AI response
            ai_response = raw_response.get('choices', [{}])[0].get('message', {}).get('content')
            
            if not ai_response:
                raise Exception('No response from AI')
            
            print(f"[AI Analyzer] AI response received ({len(ai_response)} characters)")
            
            # Save to Supabase
            print(f"[AI Analyzer] Saving to Supabase...")
            saved_conversation = self.save_to_supabase(
                user_id=user_id,
                symbol_root=symbol,
                question=f"🤖 Automated daily analysis for {symbol}",
                ai_response=ai_response,
                model='anthropic/claude-sonnet-4.5',
                json_data=json_data,
                api_payload={
                    'request_sent_to_openrouter': sent_payload,
                    'response_received_from_openrouter': raw_response
                }
            )
            
            print(f"[AI Analyzer] ✅ Successfully saved conversation: {saved_conversation.get('id')}")
            
            return {
                'symbol': symbol,
                'response': ai_response,
                'timestamp': datetime.now().isoformat(),
                'model': 'anthropic/claude-sonnet-4.5',
                'conversation_id': saved_conversation.get('id'),
                'success': True
            }
            
        except FileNotFoundError as e:
            error_msg = f"JSON file not found for {symbol}: {e}"
            print(f"[AI Analyzer] ❌ {error_msg}")
            return {
                'symbol': symbol,
                'success': False,
                'error': error_msg
            }
        except Exception as e:
            error_msg = f"Error processing {symbol}: {str(e)}"
            print(f"[AI Analyzer] ❌ {error_msg}")
            return {
                'symbol': symbol,
                'success': False,
                'error': error_msg
            }
    
    def analyze_all_stocks(
        self,
        user_id: str,
        output_dir: str = '../output',
        question: str = "Analyze this position data and provide comprehensive recommendations."
    ) -> Dict[str, Any]:
        """
        Analyze all stocks from Supabase
        
        Args:
            user_id: User ID for database storage
            output_dir: Directory containing JSON files
            question: Analysis question
        
        Returns:
            Summary of all analyses
        """
        print("\n" + "="*80)
        print("🤖 AI BATCH ANALYZER - Starting batch processing")
        print("="*80)
        
        # Fetch stock symbols
        symbols = self.fetch_stock_symbols()
        
        if not symbols:
            print("[AI Analyzer] No stock symbols found. Exiting.")
            return {
                'total': 0,
                'successful': 0,
                'failed': 0,
                'results': []
            }
        
        results = []
        successful = 0
        failed = 0
        
        for symbol in symbols:
            result = self.analyze_stock(symbol, user_id, output_dir, question)
            results.append(result)
            
            if result.get('success'):
                successful += 1
            else:
                failed += 1
        
        summary = {
            'total': len(symbols),
            'successful': successful,
            'failed': failed,
            'results': results,
            'timestamp': datetime.now().isoformat()
        }
        
        print("\n" + "="*80)
        print("📊 BATCH PROCESSING SUMMARY")
        print("="*80)
        print(f"Total stocks processed: {summary['total']}")
        print(f"✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        print("="*80)
        
        return summary


# CLI usage
if __name__ == '__main__':
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(description='AI Stock Position Analyzer')
    parser.add_argument(
        '--user-id',
        required=True,
        help='User ID for database storage'
    )
    parser.add_argument(
        '--symbol',
        help='Analyze a specific symbol (optional, analyzes all if not provided)'
    )
    parser.add_argument(
        '--output-dir',
        default='../output',
        help='Directory containing JSON files (default: ../output)'
    )
    parser.add_argument(
        '--question',
        default='Analyze this position data and provide comprehensive recommendations.',
        help='Custom analysis question'
    )
    
    args = parser.parse_args()
    
    try:
        analyzer = AIAnalyzer()
        
        if args.symbol:
            # Analyze single symbol
            result = analyzer.analyze_stock(
                symbol=args.symbol,
                user_id=args.user_id,
                output_dir=args.output_dir,
                question=args.question
            )
            
            if result.get('success'):
                print(f"\n✅ Analysis completed successfully!")
                print(f"Conversation ID: {result.get('conversation_id')}")
            else:
                print(f"\n❌ Analysis failed: {result.get('error')}")
                sys.exit(1)
        else:
            # Analyze all symbols
            summary = analyzer.analyze_all_stocks(
                user_id=args.user_id,
                output_dir=args.output_dir,
                question=args.question
            )
            
            # Save summary to file
            summary_file = f"batch_analysis_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(summary_file, 'w') as f:
                json.dump(summary, f, indent=2)
            print(f"\n📄 Summary saved to: {summary_file}")
            
            if summary['failed'] > 0:
                sys.exit(1)
        
    except ValueError as e:
        print(f"❌ Configuration Error: {e}", file=sys.stderr)
        print("\nMake sure these environment variables are set:")
        print("  - OPENROUTER_API_KEY")
        print("  - SUPABASE_URL")
        print("  - SUPABASE_SERVICE_KEY")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)