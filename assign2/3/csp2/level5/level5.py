from flask import Flask, render_template, request
import re
app = Flask(__name__)


@app.route('/')
def welcome():
    return render_template('welcome.html')


@app.route('/signup')
def signup():
    next_page = request.args.get('next', 'confirm')
    # sanitize next_page
    next_page = next_page if re.compile(r'^[a-z]+$').match(next_page) else 'confirm'
    return render_template('signup.html', next=next_page)


@app.route('/confirm')
def confirm():
    next_page = request.args.get('next', 'welcome')
    return render_template('confirm.html', next=next_page)


if __name__ == '__main__':
    app.run(debug=True)
