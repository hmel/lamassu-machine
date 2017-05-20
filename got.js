const got = require('got')

got("https://google.com").then(r => {
console.log(r.body.ca)
});
