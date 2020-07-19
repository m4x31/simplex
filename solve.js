const Equation = require('./Equation');

const run = async () => {
  const [filename] = process.argv.slice(2);
  const [log] = process.argv.slice(3);

  try {

    let eq = new Equation();
    await eq.readFile(filename);

    eq.transpose()
    eq.addSlackVariables();

    if(log) {
      eq.log();
    }

    let step = 0;
    while(!eq.isSolved && step <= 50) {
      step++;
      eq.reduce();
      
      if(log) {
        eq.log();
      }
    }

    eq.printResult();
  } catch (error) {
    console.log({error});
  }
}

run();