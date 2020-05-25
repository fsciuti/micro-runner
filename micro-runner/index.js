const ora = require('ora');
// const fork = require('child_process').fork;
const { Worker } = require('worker_threads');
const path = require('path');
const colors = require('colors');
const fs = require('fs');
const output = require('./cli/cli_output');
const args = require('./cli/args');

// const BENCHMARK_LAUNCHER = path.resolve(__dirname + '/tests_runner/tests_runner.js');
const BENCHMARK_LAUNCHER = path.resolve(__dirname + '/tests_runner/tests_runner_worker_thread.js');

const exit_error = (err) => {
    spinner.stop();
    console.error(colors.red(`\n${err}`));
    process.exit();
}

const start_benchmark = (runner, argv) => {
    const worker = new Worker(runner, {
        workerData: argv
    })
    worker.on('message', (data) => {
        output.analyze(data, args.verbose);
    })
    worker.on('error', err => {
        spinner.stop();
        throw err;
    })
    worker.on("exit", function(code){
        if(code !== 0)
            exit_error("Something went wrong! Please try again :(")
        
        spinner.succeed("benchmarks ready")
        output.render();
        if(args.XLSoutput)
            output.createXLS(path.resolve(args.XLSoutput));
    });
}

const init = async () => {
    const iterations = args.iterations;
    const module_type = args.module_type;
    let tests;

    if(args.folder){
        tests = await args.files;
        if(!tests) {
            exit_error("Review the -f argument contains a path to a folder");
        }
    } else {
        if(fs.existsSync(args.file))
            tests = [path.resolve(args.file)]
        else
            exit_error("the file doesn't exist, check the path and try again");
    } 

    start_benchmark(BENCHMARK_LAUNCHER, {tests: tests, iterations: iterations, module: module_type});
}

process.on("uncaughtException", (err) => {
    exit_error("Something went wrong! Please try again :(")
});

const spinner = ora({
    text: "running benchmarks ",
    color: "yellow"
}).start();

init();

//=============== release micro-runner 0.3.6 ==================
//TODO: replace child process with workers_threads
//TODO: verify if node supports worker thread otherwise trigger a error or message
//=============== release micro-runner 0.3.7 ==================
//TODO: refactor analyze function in cli_output
//TODO: review benchmark.js way to compare tests (https://github.com/mathiasbynens/Benchmark.js/blob/d4e874f2c0956d11bd1187870c2655eb3a3ab692/benchmark.js#L1175-1194)
//=============== release micro-runner 0.4.0 ==================
//TODO: introduce ops/sec as additional metric (https://www.npmjs.com/package/ops-per-sec)
//TODO: web server for testing in different devices