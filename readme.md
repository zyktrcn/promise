# Promise学习笔记
---
## 1. Promise解决问题

Promise主要是解决回调地狱问题。

```
// 使用小程序的回调函数展示多层回调的嵌套
// 第一层
wx.getSystemInfo({
  success (res) {
    // 第二层
    wx.getLocation({
      success (res) {
        ...
      }
    })
  }
})
```
## 2. Promise用法

- ### new Promise

```
// new Promise
new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('promise')
  }, 1000)
}).then(data => {
  console.log(data)   // 'promise'
})
```
new Promise生成一个Promise实例，参数为回调函数。该回调函数接收两个参数resolve和reject，两个参数为Promise内部方法resolve和reject，其作用为改变Promise内部状态。

>Promise内部状态有三个，pending、fulfilled和rejected。
- pending：初始值
- fulfilled：调用resolve函数
- rejected：调用reject函数
```
new Promise((resolve, reject) => {
    setTimeout(() => {
      // resolve 和 reject 同时调用
      // 只会执行顺序排前的一个
      resolve('fulfilled')
      reject('rejected')
    }, 1000)
}).then(
    // 第一个回调函数
    (state) => {
      console.log(state)   // 'fulfilled'
    },
    // 第二个回调函数
    (state) => {
      console.log(state)    // 'rejected'
    }
)
```
根据不同的状态值执行then中相应的回调函数，resolve和状态值fulfilled对应then传入的第一个回调函数，reject和状态值rejected对应then传入的第二个回调函数。

此外，Promise实例后面能调用多个then（链式调用），是解决回调地狱问题的关键。
```
new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('promise')
  }, 1000)
}).then(data => {
  console.log(data)   // 'promise'
  return 'then'
}).then(data => {
  console.log(data)   // 'then'
})
```
>每一层的then回调函数执行完成后，通过return将数据传向下一层then并执行下一层then的回调函数。  
若当层then无返回值，则下一层then回调函数接收的参数为undefine。

- ### Promise.resolve / Promise.reject

Promise.resolve / Promise.reject 接收一个参数并创建一个Promise实例，在该实例的回调函数中直接调用resolve / reject 并将参数传入。

```
// Promise.resolve
Promise.resolve('promise').then(data => {
  console.log(data)   // 'promise'
})

// 等价于
new Promise((resolve) => {
  resolve('promise')
}).then(data => {
  console.log(data)   // 'promise'
})

// Promise.reject类似
```

- ### Promise.all / Promise.race

Promise.all / Promise.race 接收一个数组参数，数组子元素为Promise实例。
- Promise.all：***所有***子元素Promise实例状态值变为fulfilled后将每个子元素Promise实例中回调函数resolve传入的参数按顺序放入数组并传递给then的回调函数。
- Promise.race：子元素Promise实例中只要有***一个***状态值为变fulfilled后将该子元素Promise实例中回调函数resolve传入的参数传递给then的回调函数。

```
const promiseArr = [
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('fist promise')
    }, 1000)
  }),
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('second promise')
    }, 1000)
  })
]

Promise.all(promiseArr).then(result => {
  console.log(result)   // ['first promise', 'second promise']
})

Promise.race(promiseArr.then(result => {
  console.log(result)   // 'first promise'
}))
```

## 3. Promise的实现

- ### new Promise

```
// promise.js
function Promise(fn) {

  // fn为创建Promise实例时传入的实例，即(resolve, reject) => { ... }

  // 设置初始状态值
  let state = 'pending'

  // 设置初始值
  let value = null

  // 创建用于保存下一层then回调函数的数组
  const callbacks = []

  // 挂载then
  this.then = function (onFulfilled, onRejected) {

    // onFulfilled：状态值为fulfilled时执行的回调函数
    // onRejected：状态值为rejected时执行的回调函数
    // 对应上文then((state) => { ... }, (state) => { ... })

    // 返回一个Promise实例
    // 实际上then也是一个Promise
    return new Promise((resolve, reject) => {

      // 用当前层Promise实例的handle方法保存下一层then（Promise）的回调函数和处理函数
      // 回调函数onFulfilled、onRejected
      // 处理函数resolve、reject

      handle({
        onFulfilled,
        onRejected,
        resolve,
        reject
      })

    })
  }

  // handle方法要处理两个情况
  // 1、当前层Promise状态值为pending时，先将下一层传入的回调函数和处理函数放入callbacks数组中保存。
  // 2、当前层Promise状态值为fulfilled / rejected时，从callbacks数组中提取下一层的回调函数和处理函数并执行。
  function handle(callback) {

    // callback为下一层then（Promise）传入的{ onFulfilled, onRejected, resolve, reject }

    // 对应第1种情况
    if (state === 'pending') {
      callbacks.push(callback)
      return
    }

    // 对应第2种情况

    // 判断当前状态是fulfilled还是rejected
    const cb = state === 'fulfilled' ? callback.onFulfilled : callback.onRejected
    const next = state === 'fulfilled' ? callback.resolve : reject

    // 如果下一层then（Promise）没有设置相应回调函数，则直接调用resolve / reject。
    // 即将当前层Promise的value传入下下层的then（Promise）
    if (!cb) {
      next(value)
      return
    }

    // 执行回调函数并获取返回值
    try {
      const ret = cb(value)
      next(ret)
    } catch (e) {
      // 回调函数出错则执行reject
      callback.reject(e)
    }

  }

  // resolve将状态值改为fulfilled并向下一层then（Promise）传递value
  // 对应new Promise((resolve, reject) => { resolve(true) }) 回调函数中第一个参数
  function resolve(newValue) {

    const fn = () => {
      if (state !== 'pending') return

      // 如果newValue是一个Promise实例，则需要通过调用其then的resolve方法获取返回值并传递到下一层。
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        const { then } = newValue

        if (typeof then === 'function') {

          // 调用Promise实例中的then并将resolve函数作为回调函数传入
          // new Promise().then(resolve)
          // 等价于new Promise().then((data) => { resolve(data) })
          // resolve是当前层的resolve函数，即将then的参数重新作为newValue传入resolve函数。
          then.call(newValue, resolve)

          return
        }
      }

      // 将当前层Promise状态值改为fulfilled
      state = 'fulfilled'

      // 用value保存向下传递的值newValue（经处理）
      value = newValue

      // handleCb是从callbacks中提取下一层then（Promise）回调函数并执行的方法
      // 等价于 通知下一层then（Promise）当前层已经执行完毕，可以开始执行下一层回调函数。
      handleCb()
    }

    setTimeout(fn, 0)

  }

  // resolve将状态值改为fulfilled并向下一层then（Promise）传递error
  // 对应new Promise((resolve, reject) => { resolve(true) }) 回调函数中第二个参数
  // 逻辑与resolve类似
  function reject(error) {

    const fn = () => {
      if (state !== 'pending') return

      if (error && (typeof error === 'object' || typeof error === 'function')) {
        const { then } = error

        if (typeof then === 'function') {

          // 调用Promise实例中的then并将resolve和reject函数作为回调函数传入
          // new Promise().then(resolve, reject)
          // 等价于new Promise().then((data) => { resolve(data) }, (err) => { reject(err) })
          // resolve / reject是当前层的resolve / reject函数，即将then的参数重新作为newValue / error传入resolve / reject函数。
          then.call(newValue, resolve, reject)

          return
        }
      }

      // 将当前层Promise状态值改为rejected
      state = 'rejected'

      value = error

      handleCb()
    }

    setTimeout(fn, 0)

  }

  // 从当前层callbacks中获取下一层then（Promise）的回调和处理函数
  function handleCb() {
    while (callbacks.length) {
      const fn = callbacks.shift()

      // fn为下一层then（Promise）的回调和处理函数
      // 即{ onFulfilled, onRejected, resolve, reject }
      // onFulfilled / onRejected是下一层then（Promise）中的回调函数
      // resolve / reject是下一层then（Promise）实例中的resolve / reject
      // 以fn作为参数执行handle方法，对应第2种情况。
      handle(fn)
    }
  }
}
```

Promise解决回调地狱的关键是then链式调用。
>then实际上也是一个Promise实例 `this.then = function(...) { return new Promise(...) } `  
挂载then的时候会创建并返回一个Promise实例，在新的Promise实例中也会挂载一个then。  
因此可以实现 `new Promise(...).then(...).then(...)`  
每一层then（Promise）通过handle方法保存下一层的回调和处理函数，当前层处理完毕后根据不同状态值执行下一层相应的回调函数。

- ### Promise.resolve / Promise.reject

`Promise.resolve('promise')` 等价于 `new Promise((resolve) => { resolve('promise' )})`  

```
// 在Promise上挂载resolve方法（非实例中的resolve）
Promise.resolve = function (value) {

  if (value && value instanceof Promise) {
    // 参数为Promise实例时直接返回该实例
    return value
  } else if (value && typeof value === 'object' && typeof value.then === 'function') {
    // 参数为类似Promise具有.then属性的对象
    // 转为Promise实例并执行then方法
    const { then } = value
    return new Promise((resolve) => {
      then(resolve)
    })
  } else if (value) {
    // 参数存在则直接创建并返回一个Promise实例
    // 执行resolve将参数向下传递
    return new Promise((resolve) => {
      resolve(value)
    })
  } else {
    // 参数不存在则直接创建并返回一个Promise实例
    return new Promise((resolve) => { resolve() })
  }

}

// 在Promise上挂载reject方法（非实例中的reject）
Promise.reject = function (error) {

  // reject方法无需判断value类型
  return enw Promise((resolve, reject) => {
    reject(error)
  })

}
```

- ### Promise.all / Promise.race

```
// 挂载all方法
Promise.all = function (arr) {

  // 参数arr为包含一个或多个Promise实例的数组

  // 转换为数组
  let args = Array.prototype.slice.call(arr)

  // 创建并返回一个Promise实例
  return new Promise((resolve, reject) => {

    // 如果无参数或参数数组为空，直接执行resolve方法。
    if (args.length === 0) return resololve([])

    // 剩余数量
    let remaining = args.length

    for (let i = 0, l = args.length; i < l; i++) {
      
      // res方法执行每一个Promise实例子元素并收集结果
      // 在所有子元素执行完毕时执行resolve向下一层then传递结果数组
      res(i, args[i])
    }

    // res方法有2种情况
    // 1、val参数为Promise实例时，执行其then方法并将结果作为参数再次执行res方法。
    // 2、val参数不为Promise实例时，将结果存入结果数组中。
    function res(i, val) {

      try {

        // 对应第1种情况
        if (val && (typeof val === 'object' || typeof val === 'function)) {
          const { then } = val
          if (typeof then === 'function') {
            // 执行Promise实例的then方法获取其传递的值
            then.call(
              val,
              (val) => {
                // 再次执行res
                res(i, val)
              }，
              reject
            )

            return
          }
        }

        // 对应第2种情况

        // 保存结果
        args[i] = val

        // 判断剩余子元素
        if (--remaining === 0) {
          
          // 无子元素时调用resolve方法向下层传递结果数组
          resolve(args)
        }

      } catch(e) {
        reject(e)
      }

    }

  })

}

// race方法更简单
// 只需要其中有一个子元素完成，则可以向下传递该子元素的结果。

// 挂载race方法
Promise.race = function (arr) {
  return new Promise((resolve, reject) => {

    for (let i = 0, l = arr.length; i < l; i++) {
      arr[i].then(resolve, reject)
    }

  })
}
```

- ### catch / finally

- catch：将reject的回调函数往外提
- finally：不管处理结果如何都执行的回调函数

```
function Promise(fn) {

  // 在Promise类中挂载catch
  this.catch = function (onError) {

    // 向then方法中传入onRejected回调函数
    this.then(null, onError)

  }

  // 在Promise类中挂载finally
  this.finally = function (onDone) {
    this.then(onDone, onDone)
  }

}
```

## 源码

## 参考
