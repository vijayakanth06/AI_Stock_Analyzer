# 📈 AI Stock Portfolio Manager and Advisor


## 📌 Overview
The **AI Stock Portfolio Manager and Advisor** is a full-stack web application that helps investors analyze their stock portfolios and get AI-powered investment advice.  

Users can:
- Upload their portfolio as a CSV file
- Visualize holdings through interactive charts
- Chat with an AI advisor specialized in stock market analysis

---

## ✨ Key Features

### 📊 Portfolio Analysis
- Upload your stock holdings as CSV  
- Get detailed analytics  

### 📈 Interactive Visualizations
- Pie charts showing total allocation  
- Equity holdings breakdown  
- Mutual fund distribution  

### 🤖 AI Investment Advisor
- Get personalized stock recommendations  
- Portfolio performance analysis  
- Market trend insights  

### 📉 Performance Tracking
- Profit/Loss calculations  
- Current vs invested value comparison  
- Daily change tracking  

---

## 🛠️ Technology Stack

### Frontend
- React.js  

### Backend
- Python Flask  
- Pandas (for data analysis)  
- Matplotlib (for chart generation)  
- Groq API (for AI chat)  

---

## 🚀 Installation Guide

### ✅ Prerequisites
- Python **3.8+**  
- Node.js **16+**  
- Groq API key (free tier available)  

### ⚙️ Backend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/ai-stock-portfolio.git
cd ai-stock-portfolio/backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create a .env file and add your API key
echo "GROQ_API_KEY=your_api_key_here" > .env

# Run the Flask server
python app.py
```

### 💻 Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm start
```

The app should now be running at: [http://localhost:3000](http://localhost:3000)  

---

## 📂 Project Structure
```
ai-stock-portfolio/
├── backend/
│   ├── app.py                # Flask application
│   ├── requirements.txt      # Python dependencies
│   └── uploads/              # Temporary file storage
└── frontend/
    ├── public/               # Static assets
    ├── src/
    │   ├── App.js            # Main React component
    │   ├── App.css           # Styling
    │   └── index.js          # React entry point
    └── package.json          # Frontend dependencies
```

---

## 📊 CSV Format Requirements
The application expects CSV files with the following columns (case-insensitive):  

```
Instrument, Qty., Avg. cost, LTP, [Type]
```

### Example:
```
Instrument,Qty.,Avg. cost,LTP,Type
RELIANCE,10,2500,2800,EQUITY
HDFC Bank,15,1500,1600,EQUITY
Nifty Index Fund,5,200,210,MF
```

---

## 💡 How It Works

1. **Data Upload**  
   Users upload their portfolio as a CSV file.  

2. **Backend Processing**  
   - Pandas calculates metrics (P&L, current value, etc.)  
   - Matplotlib generates three visualization charts  
   - Data is cleaned and sent to the frontend  

3. **Frontend Display**  
   - Interactive table with color-coded P&L  
   - Pie charts for portfolio distribution  
   - Summary statistics showing overall performance  

4. **AI Chat**  
   - Groq LLM provides stock-specific advice  
   - Context includes the user’s portfolio data  
   - Responses are strictly stock-market focused  

---

## 🌟 Example Queries for AI Advisor
- *"How is my portfolio performing?"*  
- *"What's my exposure to the energy sector?"*  
- *"Should I increase my position in RELIANCE?"*  
- *"What are some good defensive stocks to consider?"*  
- *"Explain my biggest winners and losers"*  

---

## 🐛 Troubleshooting

### CSV Upload Errors
- Ensure your CSV has the required columns  
- Remove non-numeric values in quantity/price columns  

### Chart Display Issues
- Make sure the backend is running on port **5000**  
- Check browser console for errors  

### AI Chat Not Working
- Verify your **Groq API key** is correct  
- Check backend logs for API errors  

---


## 🙏 Acknowledgments
- **Groq** for their LLM API  
- **Pandas** and **Matplotlib** teams for data tools  
- **React** and **Flask** communities  

---

💰 Happy Investing! 🚀📈
