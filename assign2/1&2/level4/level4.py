from flask import Flask, render_template, request

app = Flask(__name__)


@app.route('/')
def index():
    if not request.args.get("timer"):
        return render_template("index.html")
    else:

        return render_template("timer.html", timer=request.args.get("timer"))


if __name__ == '__main__':
    app.run()
