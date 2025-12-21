class CurrencyConverter {
    constructor() {
        this.apiKey = 'f8d4c5e2a1b3f7e9d6c8a5b2';
        this.baseUrl = 'https://v6.exchangerate-api.com/v6';
        this.fallbackUrl = 'https://api.exchangerate-api.com/v4/latest';
        this.exchangeRates = {};
        this.baseCurrency = 'USD';
        this.lastUpdated = null;
        
        this.currencyFlags = {
            'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'JPY': '🇯🇵',
            'AUD': '🇦🇺', 'CAD': '🇨🇦', 'CHF': '🇨🇭', 'CNY': '🇨🇳',
            'SEK': '🇸🇪', 'NZD': '🇳🇿', 'SGD': '🇸🇬', 'HKD': '🇭🇰'
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadExchangeRates();
        this.updateTimeDisplay();
    }

    initializeElements() {
        this.amountInput = document.getElementById('amount');
        this.fromCurrency = document.getElementById('fromCurrency');
        this.toCurrency = document.getElementById('toCurrency');
        this.swapBtn = document.getElementById('swapBtn');
        this.resultAmount = document.getElementById('resultAmount');
        this.resultCurrency = document.getElementById('resultCurrency');
        this.rateText = document.getElementById('rateText');
        this.updateTime = document.getElementById('updateTime');
        this.fromFlag = document.getElementById('fromFlag');
        this.toFlag = document.getElementById('toFlag');
        this.usdToEurTable = document.getElementById('usdToEurTable');
        this.eurToUsdTable = document.getElementById('eurToUsdTable');
    }

    setupEventListeners() {
        this.amountInput.addEventListener('input', () => this.convertCurrency());
        this.fromCurrency.addEventListener('change', () => {
            this.updateFlag('from');
            this.convertCurrency();
        });
        this.toCurrency.addEventListener('change', () => {
            this.updateFlag('to');
            this.convertCurrency();
        });
        this.swapBtn.addEventListener('click', () => this.swapCurrencies());
    }

    async loadExchangeRates() {
        try {
            let data = await this.fetchFromPrimaryAPI();
            
            if (!data) {
                data = await this.fetchFromFallbackAPI();
            }

            if (data) {
                this.exchangeRates = data.conversion_rates || data.rates;
                this.lastUpdated = new Date();
                this.populateCurrencyDropdowns();
                this.convertCurrency();
                this.generateConversionTables();
                this.updateTimeDisplay();
            }
        } catch (error) {
            console.error('Error loading exchange rates:', error);
        }
    }

    async fetchFromPrimaryAPI() {
        try {
            const url = `${this.baseUrl}/${this.apiKey}/latest/${this.baseCurrency}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`API request failed: ${response.status}`);
            
            const data = await response.json();
            
            if (data.result === 'error') {
                throw new Error(`API Error: ${data['error-type']}`);
            }
            
            return data;
        } catch (error) {
            console.warn('Primary API failed:', error.message);
            return null;
        }
    }

    async fetchFromFallbackAPI() {
        try {
            const response = await fetch(`${this.fallbackUrl}/${this.baseCurrency}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.warn('Fallback API failed:', error);
            return null;
        }
    }

    populateCurrencyDropdowns() {
        const currencies = this.getCurrencyList();
        
        this.fromCurrency.innerHTML = '';
        this.toCurrency.innerHTML = '';
        
        currencies.forEach(({ code, name }) => {
            const fromOption = new Option(`${code} - ${name}`, code);
            const toOption = new Option(`${code} - ${name}`, code);
            
            this.fromCurrency.appendChild(fromOption);
            this.toCurrency.appendChild(toOption);
        });
        
        this.fromCurrency.value = 'USD';
        this.toCurrency.value = 'EUR';
        this.updateFlag('from');
        this.updateFlag('to');
    }

    getCurrencyList() {
        const currencies = [
            { code: 'USD', name: 'US Dollar' },
            { code: 'EUR', name: 'Euro' },
            { code: 'GBP', name: 'British Pound' },
            { code: 'JPY', name: 'Japanese Yen' },
            { code: 'AUD', name: 'Australian Dollar' },
            { code: 'CAD', name: 'Canadian Dollar' },
            { code: 'CHF', name: 'Swiss Franc' },
            { code: 'CNY', name: 'Chinese Yuan' },
            { code: 'SEK', name: 'Swedish Krona' },
            { code: 'NZD', name: 'New Zealand Dollar' },
            { code: 'SGD', name: 'Singapore Dollar' },
            { code: 'HKD', name: 'Hong Kong Dollar' }
        ];
        
        return currencies.filter(currency => 
            this.exchangeRates[currency.code] !== undefined || currency.code === 'USD'
        );
    }

    updateFlag(type) {
        const currency = type === 'from' ? this.fromCurrency.value : this.toCurrency.value;
        const flagElement = type === 'from' ? this.fromFlag : this.toFlag;
        flagElement.textContent = this.currencyFlags[currency] || '🏳️';
    }

    convertCurrency() {
        const amount = parseFloat(this.amountInput.value) || 0;
        const from = this.fromCurrency.value;
        const to = this.toCurrency.value;

        if (!this.exchangeRates || !from || !to) {
            this.resultAmount.textContent = '0.00';
            return;
        }

        const { convertedAmount, exchangeRate } = this.calculateConversion(amount, from, to);
        
        this.resultAmount.textContent = this.formatNumber(convertedAmount);
        this.resultCurrency.textContent = to;
        this.rateText.textContent = `1 ${from} = ${exchangeRate.toFixed(5)} ${to}`;
    }

    calculateConversion(amount, from, to) {
        let convertedAmount, exchangeRate;

        if (from === this.baseCurrency) {
            exchangeRate = this.exchangeRates[to] || 1;
            convertedAmount = amount * exchangeRate;
        } else if (to === this.baseCurrency) {
            exchangeRate = 1 / (this.exchangeRates[from] || 1);
            convertedAmount = amount * exchangeRate;
        } else {
            const fromRate = this.exchangeRates[from] || 1;
            const toRate = this.exchangeRates[to] || 1;
            exchangeRate = toRate / fromRate;
            convertedAmount = amount * exchangeRate;
        }

        return { convertedAmount, exchangeRate };
    }

    generateConversionTables() {
        const amounts = [1, 5, 10, 25, 50, 100, 500, 1000, 5000, 10000];
        
        // USD to EUR table
        this.usdToEurTable.innerHTML = amounts.map(amount => {
            const { convertedAmount } = this.calculateConversion(amount, 'USD', 'EUR');
            return `
                <div class="table-row">
                    <div class="table-cell from">${amount} USD</div>
                    <div class="table-cell to">${this.formatNumber(convertedAmount)} EUR</div>
                </div>
            `;
        }).join('');
        
        // EUR to USD table
        this.eurToUsdTable.innerHTML = amounts.map(amount => {
            const { convertedAmount } = this.calculateConversion(amount, 'EUR', 'USD');
            return `
                <div class="table-row">
                    <div class="table-cell from">${amount} EUR</div>
                    <div class="table-cell to">${this.formatNumber(convertedAmount)} USD</div>
                </div>
            `;
        }).join('');
    }

    formatNumber(number) {
        if (number >= 1000) {
            return number.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        return number.toFixed(2);
    }

    swapCurrencies() {
        const fromValue = this.fromCurrency.value;
        const toValue = this.toCurrency.value;
        
        this.fromCurrency.value = toValue;
        this.toCurrency.value = fromValue;
        
        this.updateFlag('from');
        this.updateFlag('to');
        this.convertCurrency();
    }

    updateTimeDisplay() {
        const now = new Date();
        const utcTime = now.toLocaleTimeString('en-US', { 
            timeZone: 'UTC', 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        this.updateTime.textContent = `${utcTime} UTC`;
        
        // Update every minute
        setInterval(() => {
            const now = new Date();
            const utcTime = now.toLocaleTimeString('en-US', { 
                timeZone: 'UTC', 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            this.updateTime.textContent = `${utcTime} UTC`;
        }, 60000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
    
    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });
    }
});