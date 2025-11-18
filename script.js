// script.js में ws.onmessage के अंदर का संशोधित हिस्सा (लगभग लाइन 59)

            // डेटा प्रोसेसिंग और डीबगिंग लॉजिक
            if (data.channel === 'ticker' && data.data) {
                const ticker = data.data;

                // *** 🛑 डीबगिंग स्टेप: Ticker डेटा के सभी keys को प्रिंट करें 🛑 ***
                // इससे आपको funding rate फ़ील्ड का सही नाम पता चलेगा
                console.log("--- Ticker Keys ---");
                console.log(Object.keys(ticker));
                console.log("-------------------");

                // यहाँ आपको Console में मिली सही फ़ील्ड का नाम डालना है।
                // संभावित नाम: funding_rate, fr, rate, fundingRate
                
                const symbol = ticker.symbol;
                
                // **** आपको Console आउटपुट देखकर यहाँ इन तीनों में से एक को चुनना है: ****
                let fundingRateValue = ticker.funding_rate; // अनुमान 1
                // let fundingRateValue = ticker.rate;        // अनुमान 2
                // let fundingRateValue = ticker.fr;          // अनुमान 3
                
                
                // *** 🧪 Console में फंडिंग रेट की वैल्यू प्रिंट करें ***
                if (symbol && fundingRateValue !== undefined) {
                    console.log(`Symbol: ${symbol}, Funding Rate Field Value: ${fundingRateValue}`);

                    const fundingRate = parseFloat(fundingRateValue); 

                    if (!isNaN(fundingRate)) {
                        marketRates[symbol] = fundingRate;
                    }
                }
            }
