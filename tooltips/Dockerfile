FROM node:20

WORKDIR /src

COPY tooltips/stoneshard-tooltips-and-formulas.json .
COPY tooltips/package.json .
COPY .prettierrc.json .
 
RUN npm install

ENTRYPOINT ["node", "compare-tooltips.js"]
