const readLines = require('./parse.js');


class Equation {
  constructor(table = []) {
    this.table = table;
    // looks like
    // [
    //   [fac, fac, res], <- constraint
    //   [fac, fac, res], <- constraint
    //   [fac, fac, 0], <- objective function
    // ]
    // or with slack variables
    // [
    //   [fac, fac, slack, slack, res], <- constraint
    //   [fac, fac, slack, slack, res], <- constraint
    //   [fac, fac, slack, slack, 0], <- objective function
    // ]

  }

  _subtractRows(minuend, subtrahend) {
    return minuend.map((val, index) => {
      return val - subtrahend[index];
    })
  }

  _multiplyRow(row, factor) {
    return row.map((val) => {
      return val * factor;
    })
  }

  _indexOfMin(numbers) {

    let smallest = Infinity;
    let index = 0;

    numbers.map((num, i) => {
      if (num < smallest) {
        smallest = num;
        index = i;
      };
    });

    return index;
  }

  transpose() {
    let table = new Array(this.tableWidth).fill(1);
    table = table.map((_) => {
      return new Array(this.tableHeight).fill(1);
    })

    for(let i = 0; i < this.tableWidth; i++) {
      for(let j = 0; j < this.tableHeight; j++) {
        table[i][j] = this.table[j][i];
      }
    }

    this.table = table;
    return this;
  }

  async readFile(file) {
    try {
      const [objective, constraints] = await readLines(file);  

      this.table = [
        ...constraints,
        objective.concat(0),
      ];

      return this;
    } catch (error) {
      throw new Error('Could not construct Equation.' + error);
    }
  }


  log() {
    console.table(this.table)
    console.log({
      pivotColIndex: this.pivotColIndex,
      pivotRowIndex: this.pivotRowIndex,
      pivotElement: this.pivotElement,
      isSolved: this.isSolved,
      mostLimitingValues: this.mostLimitingValues,
    });

    return this;
  }

  addSlackVariables() {
    this.table = this.table.map((row, index) => {
      if(index !== this.tableHeight - 1) {
        // constraints
        const factors = row.slice(0, row.length - 1)
        const slacks = new Array(this.tableHeight - 1).fill(0).map((_, j) => {
          return index === j ? 1 : 0;
        });
        const result = row[row.length - 1];
        return [...factors, ...slacks, result];
      } else {
        //objective function
        const pad = new Array(this.tableHeight - 1).fill(0);
        return [...row, ...pad];
      }
    });

    return this;
  }

  reduce() {
    const pivotRow = this.table[this.pivotRowIndex];
    const reducedPivotRow = this._multiplyRow(pivotRow, 1/this.pivotElement);

    const newTable = this.table.map((row, index) => {
      if (index === this.pivotRowIndex) {
        return reducedPivotRow;
      } else {
        const fac = row[this.pivotColIndex] / reducedPivotRow[this.pivotColIndex];
        return this._subtractRows(row, this._multiplyRow(reducedPivotRow, fac));
      }
    })

    this.table = newTable;

    return this;
  }

  printResult() {

    const end  = this.tableWidth;
    const start = end - this.tableHeight;

    let values = this.objectiveRow.slice(start, end).map((val) => {
      const num = Number(Math.abs(val))
      return parseFloat(num.toFixed(5), 10);
    })

    const res = {};

    values.map((el, index) => {
      if(index < values.length - 1) {
        res['x'+index] = el;
      } else {
        res['Value of objective function'] = el;
      }
    })

    console.table(res);

  }

  get tableWidth() {
    return this.table[0].length;
  }

  get tableHeight() {
    return this.table.length;
  }

  get objectiveRow() {
    return this.table[this.tableHeight - 1]
  }

  get constraintResults() {
    return this.table.filter((val, index) => {
      return index < (this.tableHeight -1);
    }).map((row, index) => {
      return row[row.length - 1];
    })
  }

  get pivotRowIndex() {
    return this._indexOfMin(this.mostLimitingValues);
  }

  get mostLimitingValues() {
    const mostLimitingValues = this.constraintResults.map((constraintResult, row) => {
      if(constraintResult === 0) {
        return Infinity;
      }
      return (constraintResult / this.table[row][this.pivotColIndex]);
    })

    return mostLimitingValues;
  }

  get pivotColIndex() {
   const maxNum = Math.max(...this.objectiveRow);
   const pivotColIndex = this.objectiveRow.indexOf(maxNum);
   return pivotColIndex;
  }

  get pivotElement() {
    return this.table[this.pivotRowIndex][this.pivotColIndex];
  }

  get isSolved() {
    const sol = !this.objectiveRow.some(element => element > 0);
    return sol;
  }
}

module.exports = Equation;