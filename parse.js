const readline = require('readline');
const fs = require('fs');
const constrainsRowRegex = /([+-] [0-9]*)/g;
const constrainsRHSRegex = /(?:[>=] ([0-9]*))/;
const objectiveFnRegex = /(?:[min\:] (.*))/;
const objectiveFactorRegex = constrainsRowRegex;

const factorRegex = /([+-]) ([0-9])*/;

let line = -1;
const lineNum = () => {
  line++;
  return line;
}

const parseObjectiveFn = (line) => {

  const [_, fn] = line.match(objectiveFnRegex);
  const factors = fn.match(objectiveFactorRegex);

  const eq = factors.map(factor => {
    const [_, operator, num] = factor.match(factorRegex);
    return parseInt(operator+num, 10);
  });

  return eq;
}

const parseConstrainsRowRHS = (line) => {
  const [_, rhs] = line.match(constrainsRHSRegex);

  return parseInt(rhs);
}

const parseConstrainsRowLHS = (line) => {
  const factors = line.match(constrainsRowRegex);

  return factors.map(factor => {
    const [_, operator, num] = factor.match(factorRegex);
    return parseInt(operator+num, 10);
  });
}

const parseConstrainsRow = (line) => {
  const lhs = parseConstrainsRowLHS(line);
  const rhs = parseConstrainsRowRHS(line)
  return [...lhs, rhs];
}


module.exports = async (file) => {

  try {
    const fileStream = fs.createReadStream(file);

    let objectiveFn = null;
    let constrainsMatrix = [];

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      const index = lineNum();
      // console.log(`${index}: ${line}`);

      if(index === 1) {
        objectiveFn = parseObjectiveFn(line);
      }

      if(index >= 3) {
        constrainsMatrix.push(parseConstrainsRow(line));
      }
    }

    return [objectiveFn, constrainsMatrix];

  } catch (error) {
    console.log('Coulld not read file:', file);
  }
}
