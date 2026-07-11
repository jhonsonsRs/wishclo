Wishclo solves a simple but annoying problem: when you shop for clothes across multiple different websites (Shein, Zara, Nike, Renner, and so on), there's no single place to see everything you want to buy and how much it will all cost together. Wishclo brings every item into one dashboard, regardless of which store it came from, and keeps a running total of what you plan to spend.

This is currently a personal project, built for individual use rather than for sharing wishlists with others.

Features (MVP)


Universal cart — save clothing items from any online store in a single list
Manual entry — add an item by typing in its name, price, store, color, size, and image
Paste-a-link entry — paste a product URL and the app attempts to automatically extract the title, price, and image from the page's metadata, falling back to manual entry if it fails
Live total — automatically sums the price (and shipping) of every item marked as "want to buy"
Status tracking — mark items as want to buy, purchased, or out of stock
Filtering — filter items by store or by status


Tech stack

LayerChoiceFrontendHTML / CSS / JavaScriptBackendPython + FastAPILink scrapingrequests + BeautifulSoup (metadata extraction)DatabasePostgreSQLHosting (backend)Railway / Render (free tier)

Roadmap

Phase 1 (MVP)


 Universal cart with manual entry
 Paste-a-link entry with automatic metadata extraction
 Live total calculation


Phase 2 (future)


 Body and garment-fit measurement profile
 Size suggestion based on measurement history
 Authentication (if the app is ever hosted publicly)
 Browser extension for adding items while browsing
 Price-drop notifications


Getting started

bash# clone the repo
git clone https://github.com/<your-username>/wishclo.git
cd wishclo

# backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# frontend
cd ../frontend
# open index.html in your browser, or serve it with any static server

Status

🚧 Early development — this project is a work in progress.

License

Personal project, license to be defined.