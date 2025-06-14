import os
import io
import base64
import pandas as pd
from flask import Flask, request, jsonify, render_template
from groq import Groq
from dotenv import load_dotenv
import uuid
from flask_cors import CORS
import warnings
import logging

# Suppress warnings
warnings.filterwarnings("ignore")
logging.getLogger('matplotlib.font_manager').disabled = True

load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit
CORS(app)

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Set matplotlib backend
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas

def generate_pie_chart(data, title):
    """Generate a pie chart with dark theme styling"""
    try:
        # Create figure with dark background
        fig = plt.figure(figsize=(8, 6), dpi=100, facecolor='#1F2937')  # Dark background
        canvas = FigureCanvas(fig)
        ax = fig.add_subplot(111)
        
        # Set dark theme colors
        text_color = 'white'
        explode = [0.1 if i == max(data.values()) else 0 for i in data.values()]
        
        # Create pie chart
        wedges, texts, autotexts = ax.pie(
            data.values(),
            labels=data.keys(),
            autopct='%1.1f%%',
            startangle=90,
            explode=explode,
            shadow=True,
            textprops={'color': text_color}
        )
        
        # Style the chart
        ax.axis('equal')
        ax.set_title(title, color=text_color, pad=20)
        
        # Save to buffer
        buffer = io.BytesIO()
        canvas.print_png(buffer)
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return img_base64
    finally:
        plt.close(fig)

def process_portfolio_csv(file_stream):
    """Process portfolio CSV from file stream and return analyzed data"""
    try:
        # Read the CSV file directly from the file stream
        df = pd.read_csv(file_stream)
        
        # Clean and standardize columns
        df.columns = df.columns.str.strip().str.replace('"', '').str.replace('.', '').str.lower()
        required_cols = ['instrument', 'qty', 'avg cost', 'ltp']
        
        # Check for required columns
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {', '.join(missing_cols)}")
        
        # Calculate derived values
        df['invested'] = df['qty'] * df['avg cost']
        df['current_value'] = df['qty'] * df['ltp']
        df['pnl'] = df['current_value'] - df['invested']
        df['pnl_percent'] = (df['pnl'] / df['invested']) * 100
        
        # Categorize holdings
        if 'type' not in df.columns:
            df['type'] = df['instrument'].apply(
                lambda x: 'MF' if any(word in str(x).upper() for word in ['MF', 'MUTUAL', 'FUND']) else 'EQUITY'
            )
        
        # Calculate totals
        totals = {
            'total_investment': float(df['invested'].sum()),
            'current_value': float(df['current_value'].sum()),
            'total_pnl': float(df['pnl'].sum()),
            'pnl_percent': float((df['pnl'].sum() / df['invested'].sum()) * 100)
        }
        
        # Generate charts data
        equity_df = df[df['type'].str.upper() == 'EQUITY']
        mf_df = df[df['type'].str.upper() == 'MF']
        
        # Prepare data for pie charts
        pie_data = {
            'total': {
                'EQUITY': equity_df['invested'].sum(),
                'MUTUAL FUNDS': mf_df['invested'].sum(),
                'OTHERS': totals['total_investment'] - equity_df['invested'].sum() - mf_df['invested'].sum()
            }
        }
        
        if not equity_df.empty:
            top_equity = equity_df.nlargest(10, 'invested')
            pie_data['equity'] = {row['instrument']: row['invested'] for _, row in top_equity.iterrows()}
        
        if not mf_df.empty:
            pie_data['mf'] = {row['instrument']: row['invested'] for _, row in mf_df.iterrows()}
        
        return {
            'table_data': df.to_dict('records'),
            'pie_data': pie_data,
            'totals': totals,
            'holdings': {row['instrument'].upper(): row['invested'] for _, row in df.iterrows()}
        }
    except Exception as e:
        app.logger.error(f"Error processing portfolio: {str(e)}")
        raise

def clean_data(data):
    """Recursively clean data by converting NaN/Inf to None"""
    if isinstance(data, dict):
        return {k: clean_data(v) for k, v in data.items()}
    elif isinstance(data, (list, tuple)):
        return [clean_data(item) for item in data]
    elif isinstance(data, (int, float)):
        if pd.isna(data) or data == float('inf') or data == float('-inf'):
            return None
        return data
    return data

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload and process entirely in memory"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if not file.filename.lower().endswith('.csv'):
            return jsonify({'error': 'Invalid file type. Please upload a CSV file.'}), 400

        # Process the file directly from memory
        try:
            # Use file.stream to read directly without saving
            file_stream = io.StringIO(file.stream.read().decode('utf-8'))
            processed_data = process_portfolio_csv(file_stream)
            
            # Generate pie charts
            pie_charts = {}
            
            if 'total' in processed_data['pie_data'] and any(v > 0 for v in processed_data['pie_data']['total'].values()):
                pie_charts['total'] = generate_pie_chart(
                    processed_data['pie_data']['total'], 
                    'Total Portfolio Allocation'
                )
            
            if 'equity' in processed_data['pie_data'] and processed_data['pie_data']['equity']:
                pie_charts['equity'] = generate_pie_chart(
                    processed_data['pie_data']['equity'],
                    'Equity Holdings Breakdown'
                )
            
            if 'mf' in processed_data['pie_data'] and processed_data['pie_data']['mf']:
                mf_data = processed_data['pie_data']['mf']
                if mf_data and sum(mf_data.values()) > 0:
                    pie_charts['mf'] = generate_pie_chart(
                        mf_data,
                        'Mutual Fund Holdings Breakdown'
                    )
            
            # Clean all data before JSON serialization
            cleaned_data = {
                'success': True,
                'table_data': clean_data(processed_data['table_data']),
                'pie_charts': pie_charts,
                'totals': clean_data(processed_data['totals']),
                'holdings': clean_data(processed_data['holdings'])
            }
            
            return jsonify(cleaned_data)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            app.logger.error(f"Processing error: {str(e)}")
            return jsonify({'error': 'Error processing your portfolio file'}), 500
            
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/chat', methods=['POST'])
def handle_chat():
    """Handle stock-related questions"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        chat_history = data.get('chat_history', [])
        portfolio_data = data.get('portfolio_data', {})
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Prepare system prompt
        system_prompt = """You are an expert AI Stock Portfolio Advisor. Your role is to:
        - Analyze stock portfolios
        - Provide investment insights
        - Offer market analysis
        - Suggest portfolio improvements
        - Explain stock market concepts
        
        Rules:
        1. ONLY answer stock market related questions
        2. If portfolio data exists, use it for personalized advice
        3. For non-stock questions, politely decline
        4. Be concise but informative
        5. Use markdown for formatting when helpful
        """
        
        # Add portfolio context if available
        if portfolio_data.get('totals') and portfolio_data.get('holdings'):
            holdings_list = []
            for instrument, value in portfolio_data['holdings'].items():
                holdings_list.append(f"{instrument}: ₹{value:,.2f}")
            
            system_prompt += f"""
            \nCurrent Portfolio Summary:
            - Total Investment: ₹{portfolio_data['totals'].get('total_investment', 0):,.2f}
            - Current Value: ₹{portfolio_data['totals'].get('current_value', 0):,.2f}
            - P&L: ₹{portfolio_data['totals'].get('total_pnl', 0):,.2f} ({portfolio_data['totals'].get('pnl_percent', 0):.2f}%)
            
            Detailed Holdings:
            {', '.join(holdings_list)}
            """
        
        # Prepare messages for Groq
        messages = [
            {"role": "system", "content": system_prompt},
            *[{"role": "user" if msg['sender'] == 'user' else "assistant", "content": msg['message']} 
              for msg in chat_history],
            {"role": "user", "content": message}
        ]
        
        # Get response from Groq
        response = groq_client.chat.completions.create(
            messages=messages,
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            temperature=0.7,
            max_tokens=1024
        ).choices[0].message.content
        
        return jsonify({
            'success': True,
            'response': response
        })
        
    except Exception as e:
        app.logger.error(f"Chat error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)