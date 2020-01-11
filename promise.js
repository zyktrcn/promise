/*
  new Promise作为第一层Promise
  传入fn为第一层Promise的回调函数(resolve, reject) => { …… }

  then作为后面第N层Promise（N >= 2）
  传入fn为Promise内定义的回调函数
  (resolve, reject) => {
    handle({ onFulfilled, resolve })
  }

  1.创建第一层Promise
  2.在第一层Promise上挂载一个then函数
  3.then函数接收一个onFulfilled回调函数并返回一个Promise作为第二层Promise
  4.第二层Promise调用第一层Promise实例包含的handle函数
  5.handle函数接收then的回调函数onFulfilled和第二层Promise的resolve函数 // then和第二层Promise是相同的
  6.handle函数将第二层的回调和resolve存入callbacks
  7.执行第一层Promise的fn回调函数并将resolve函数作为参数传入
  8.在自定义fn回调函数中调用resolve函数
  9.resolve函数将第一层Promise的状态从pending设置为fulfiled并接收传入的值newValue
  10.在handleCb函数中执行第二层Promise的回调函数和resolve
  11.若then有自定义回调函数onFulfilled则执行回调后再执行第二层Promise的resolve函数；若无，则直接执行resolve并将第一层Promise的newValue传入

  多层then则重复以上9-11步骤
  创建Promise实例并挂载then函数时，会创建并返回一个Promise实例，多层then则递归创建与执行。
*/

function Promise(fn) {

    let state = 'pending'
    let value = null
    const callbacks = []

    this.then = function(onFulfilled, onRejected) {
        return new Promise((resolve, reject) => {

            console.log('then')

            handle({
                onFulfilled,
                onRejected,
                resolve,
                reject
            })

        })
    }

    // 处理错误
    this.catch = function(onError) {
        this.then(null, onError)
    }

    // 处理不依赖与promise状态事件
    this.finally = function(onDone) {
        this.then(onDone, onDone)
    }

    function handle(callback) {
        if (state === 'pending') {

            console.log('hadle pending')

            callbacks.push(callback)
            return
        }

        console.log('handle fulfilled')
        console.log(callback)

        const cb = state === 'fulfilled' ? callback.onFulfilled : callback.onRejected
        const next = state === 'fulfiled' ? callback.resolve : callback.reject

        if (!cb) {
            next(value)
            return
        }

        try {
            const ret = cb(value)
            next(ret)
        } catch (e) {
            callback.reject(e)
        }
    }

    function resolve(newValue) {
        const fn = () => {
            if (state !== 'pending') return

            console.log('change \'pending\' to \'fulfiled\'')
            console.log('newValue:', newValue)

            // 处理上一层then返回Promise的情况
            if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
                const { then } = newValue
                console.log('then:', then)

                if (typeof then === 'function') {
                    // 将resolve函数作为Promise.then的函数接收结果并在本层Promise中再执行一次resolve
                    then.call(newValue, resolve)
                    return
                }
            }

            state = 'fulfilled'
            value = newValue
            handleCb()

        }

        setTimeout(fn, 0)
    }

    function reject(error) {
        const fn = () => {
            if (state !== 'pending') return

            if (error && (typeof error === 'object' || typeof error === 'function')) {
                const { then } = error
                if (typeof then === 'function') {
                    then.call(error, resolve, reject)
                }
            }

            state = 'rejected'
            value = error
            handleCb()

        }

        setTimeout(fn, 0)
    }

    function handleCb() {

        console.log('callbacks:', callbacks)

        while (callbacks.length) {
            const fn = callbacks.shift()
            handle(fn)
        }
    }

    fn(resolve, reject)

}

Promise.resolve = function(value) {
    if (value && value instanceof Promise) {

        console.log('Promise 实例')

        return value
    } else if (value && typeof value === 'object' && typeof value.then === 'function') {

        console.log('Promise实例的then方法')

        let then = value.then
        return new Promise(resolve => {
            then(resolve)
        })
    } else if (value) {
        return new Promise(resolve => resolve(value))
    } else {
        return new Promise(resolve => resolve())
    }
}

Promise.reject = function(value) {
    return new Promise((resolve, reject) => {
        reject(value)
    })
}

Promise.all = function(arr) {

    let args = Array.prototype.slice.call(arr)

    return new Promise((resolve, reject) => {

        if (args.length === 0) return resolve([])

        let remaining = args.length

        for (let i = 0; i < args.length; i++) {
            res(i, args[i])
        }

        function res(i, val) {
            try {
                if (val && (typeof val === 'object' || typeof val === 'function')) {
                    let then = val.then
                    if (typeof then === 'function') {
                        then.call(
                            val,
                            (val) => {
                                res(i, val)
                            },
                            reject
                        )
                        return
                    }
                }

                args[i] = val

                if (--remaining === 0) {
                    resolve(args)
                }

            } catch (e) {
                reject(e)
            }
        }

    })

}

Promise.race = function(arr) {
    return new Promise((resolve, reject) => {
        for (let i = 0, l = arr.length; i < l; i++) {
            arr[i].then(resolve, reject)
        }
    })
}

module.exports = {
    Promise
}