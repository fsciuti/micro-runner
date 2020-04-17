const ora = require('ora');
const fork = require('child_process').fork;
const path = require('path');
const colors = require('colors');
const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const output = require('./cli/cli_output');
const args = require('./cli/args');

const files_list = async (url) => {
    let files;

    try{
        files  = await readdir(path.resolve(url))
    } catch(err){
        spinner.stop();
        console.error(colors.red("the directory doesn't exist, check the path again"));
        process.exit();
    }
    
    files = files.filter(file => {
        if(path.extname(file).toLowerCase() === '.js')
            return file
    })
    
    return files.map(file => path.resolve(url) + "/" + file);
}

const init = async () => {
    let iterations = args.iterations;
    let tests;

    if(args.folder){
        tests = await files_list(args.folder);
    } else {
        if(fs.existsSync(args.file)){
            tests = [path.resolve(args.file)]
        }else{
            spinner.stop();
            console.error(colors.red("the file doesn't exist, check the path and try again"));
            process.exit();
        }

    } 

    const child = fork('./tests_runner.js', [JSON.stringify({tests: tests, iterations: iterations})])
    child.on("exit", function(){
        spinner.succeed("benchmarks ready")
        output.render();
        if(args.XLSoutput)
            output.createXLS(path.resolve(args.XLSoutput));
    });
    child.on("message", (data) => {
        output.analyze(data, args.verbose);
    })
    child.on("error", (err) => {
        spinner.stop();
        throw err;
    })
}

process.on("uncaughtException", (err) => {
    console.error(colors.red("Something went wrong! Please try again :("));
    spinner.stop();
    process.exit();
});

const spinner = ora({
    text: "running benchmarks",
    color: "yellow"
}).start();

init();

//TODO: having multiple benchmark in the same file
//TODO: process.exit after N seconds
//TODO: REFACTOR: move files list logic into args.js
//TODO: review APIs for creating tests and publish to micro-runner
//TODO: web server for testing in different devices
//TODO: adding scripts for releasing (branching, npm publish...)
//TODO: add --help
//TODO: structure monorepo with node_modules shared (yarn for docs "preinstall": "yarn install --modules-folder ../node_modules")