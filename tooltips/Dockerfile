FROM node:20

WORKDIR /src

COPY tooltips/stoneshard-tooltips-and-formulas.json .
COPY tooltips/package.json .
 
RUN npm install jsdom

ENTRYPOINT ["node", "compare-tooltips.js"]
