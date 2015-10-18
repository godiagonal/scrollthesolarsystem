Strukturera upp main.js

Asteroidbältet, i princip en lång rad med objekt som är lite kurvad.
 - Objekt i svg förflyttas till höger vid scroll.

Ingen titel för time machine.

Ta bort "warp drive"

Fyll i data om planeter vid getPlanetData()
 - Yttemperatur
 - Avstånd från solen
 - Omloppstid
 - Radie
 - Beskrivning

Avstånd från solen uppdateras kontinuerligt. Ta från data[52]
och mappa mot scrolltop för respektive planet.





Heliocenstrisk vy:
- Kontroll för scale och slider för datum.
- Knapp för att visa scrollvy.
- Namntaggar bredvid planeter.

Scrollvy:
- Avstånd från solen.
- Lista med planeter och länkar till respektive planet.
- Knapp för att visa heliocentrisk vy.

Ändra till mobilläge om width < height. I mobilläge är title och controls relativt
placerade över respektive under den heliocentriska vyn.

Text i början:
This is a bird's eye view of what our solar system looks like today according to
NASA's calculations. By using the slider to the right you can reverse or predict
the future motion of the planets.
To start exploring the planets begin scrolling down. (pil ner)

This is our solar system and what it looks like today.
Use the slider to the right to make the planets travel back and forth in time.

Hämta data från http://ssd.jpl.nasa.gov/horizons.cgi med följande data:
    Ephemeris Type [change] : 	OBSERVER
    Target Body [change]    : 	Earth [Geocenter] [399]
    Observer Location [change] : 	Sun (body center) [500@10]
    Time Span [change]      : 	Start=2015-10-12, Stop=2015-11-11, Step=1 d
    Table Settings [change] : 	QUANTITIES=18,19
    Display/Output [change] : 	plain text

Färger: http://www.colourlovers.com/palette/1114913/neptune_to_mars

