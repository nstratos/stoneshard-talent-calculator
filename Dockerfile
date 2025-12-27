# Usage:
# 
# docker build -t stoneshard-talent-calculator-tests .
# docker run --rm stoneshard-talent-calculator-tests  

FROM node:20-alpine

WORKDIR /app

COPY . .

CMD ["node", "--test"]