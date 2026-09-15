# anniv-diner

Un paquet à ouvrir, trois cartes, un bon pour un dîner, un bouton Non qui refuse
qu'elle paie, et la question du créneau.

## Modifier

Tout est dans **`content.js`** : son prénom (`her`), le numéro WhatsApp, la date
réservée, et chaque texte de chaque écran.

## Tester en local

```bash
python3 -m http.server 8911
# puis http://localhost:8911
```

Ajoute `#intro`, `#reveal`, `#pay`, `#slot`, `#pick` ou `#done` à l'URL pour
sauter directement à un écran.

## Comment la réponse arrive

- « Oui, j'y serai » ouvre WhatsApp avec « Samedi 21h15, j'y serai ❤️ ».
- « Pas dispo » ouvre un calendrier des 14 soirs suivants. Le samedi réservé est
  retiré et les vendredis sont fermés pour shabbat. Le message WhatsApp donne le
  soir choisi.
- Il n'y a pas de serveur. Tu n'es prévenu que si elle envoie le message.

## A savoir

Si le site est publié sur GitHub Pages en dépôt public, le numéro et la photo
sont lisibles par quelqu'un qui trouve le dépôt. `robots.txt` et la balise
`noindex` évitent seulement les moteurs de recherche.
