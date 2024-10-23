# CHALLENGE: Write your own JSON Parser

This repo is an attempt to [implement a JSON parser according to the following spec](https://www.json.org/json-en.html).  The test files used to validate the project can be found [here](https://www.json.org/JSON_checker/)

Credit to Jon Crickett for the inspriation.  [Check out the challenge here](https://codingchallenges.fyi/challenges/challenge-json-parser)

# Getting Started

## Requirements

I used deno to build this project so, if you want it to work out-of-the-box, head over to the [deno docs](https://docs.deno.com/runtime/) and download the runtime.


## Steps

1. clone the repo and open the project

```sh 
git clone git@github.com:kenpfowler/coding-challenge-json-parser.git

cd ./coding-challenge-json-parser.git/
```

2. run the test suite

```sh
deno run test
```

all test should pass

3. test the functionality by adding another test

in the tests folder create a test and name it in the following format "pass" | "fail + number + .txt

if the test should pass, add valid json to the file

if the test should fail add invalid json to the file

then run the test suite again with:

```sh
deno run test
```