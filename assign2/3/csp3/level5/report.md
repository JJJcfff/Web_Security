Patch:
I sanitized the input by checking if the input only contains numbers and characters.
```next_page = next_page if re.compile(r'^[a-z]+$').match(next_page) else 'confirm'```
---

App is based on python 3.11 and Flask

To run the app, 
Simply run the following command in the terminal:
```bash
python ./level5.py
```
and go to http://127.0.0.1:5000/

