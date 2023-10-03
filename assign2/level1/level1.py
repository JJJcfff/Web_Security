from flask import Flask, render_template_string, request

app = Flask(__name__)

page_header = """
<!doctype html>
<html>
  <head>
    <!-- Internal game scripts/styles, mostly boring stuff -->
    <link rel="stylesheet" href="/static/game-frame-styles.css" />
  </head>

  <body id="level1">
    <img src="/static/logos/level1.png">
    <div>
"""

page_footer = """
    </div>
  </body>
</html>
"""

main_page_markup = """
<form action="" method="GET">
  <input id="query" name="query" value="Enter query here..."
    onfocus="this.value=''">
  <input id="button" type="submit" value="Search">
</form>
"""


@app.route('/')
def index():
    return render_template_string(page_header + main_page_markup + page_footer)


@app.route('/', methods=['GET', 'POST'])
def search():
    if request.method == 'POST':
        query = request.form.get('query', '[empty]')

        # Handle search logic here
        # You can replace the following message with actual search results
        message = f"Search results for: <b>{query}</b>"
    else:
        message = ""

    return render_template_string(page_header + message + page_footer)


if __name__ == "__main__":
    app.run()
