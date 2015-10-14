Hämta data från http://ssd.jpl.nasa.gov/horizons.cgi med följande data:
    Ephemeris Type [change] : 	OBSERVER
    Target Body [change]    : 	Earth [Geocenter] [399]
    Observer Location [change] : 	Sun (body center) [500@10]
    Time Span [change]      : 	Start=2015-10-12, Stop=2015-11-11, Step=1 d
    Table Settings [change] : 	QUANTITIES=18,19
    Display/Output [change] : 	plain text

Färger: http://www.colourlovers.com/palette/1114913/neptune_to_mars

Hämta år för år och spara i db, manuell uppdatering genom ett api-anrop.

1. Översikt över planetpositioner i början.
2. Börja scrolla, zoomar in på solen och fadear ut heliocentrisk vy.
3. Scrollvy börjar när man scrollar lite längre och halva solen kommer ner från toppen.
4. När man fortsätter scroll visas fler respektive planet samt information om planeten.

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