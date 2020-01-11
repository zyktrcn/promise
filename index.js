/*
new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve({ test: 1 })
    resolve({ test: 2 })
    reject({ test: 3 })
  }, 1000)
}).then((data) => {
  console.log('result1', data)
}, (data) => {
  console.log('result2', data)
}).then((data) => {
  console.log('result3', data)
})
*/

const { Promise } = require('./promise.js')
/*
new Promise((resolve) => {
  setTimeout(() => {
    console.log('this is original promise')
    resolve('test')
  }, 1000)
}).then((data) => {
  console.log('this is the first then')
  console.log(data)
  return test()
}).then((data) => {
  console.log('this is the second then')
  console.log(data)
})

function test() {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('this is original promise')
      resolve('test')
    }, 1000)
  })
}
*/

/*
Promise.resolve('promise').then(data => {
  console.log('data:', data)
})
*/

/*
Promise.all([
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(1)
    }, 1000)
  }),
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(2)
    }, 2000)
  })
]).then(data => {
  console.log(data)
})
*/

/*
Promise.race([
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(1)
    }, 1000)
  }),
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(2)
    }, 2000)
  })
]).then(data => {
  console.log(data)
})
*/
