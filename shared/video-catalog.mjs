// Versioned scene/form bindings. Generated from the reviewed reference inventory.
export const VIDEO_CATALOG = [
  {
    "id": "film-drive-v1",
    "design": "drive",
    "name": "Save the Date Drive",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "drive-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Save the Date",
          "scene": "title",
          "questions": [
            {
              "path": "title",
              "label": "Title on the road (script)",
              "type": "text",
              "required": false,
              "maxLength": 20
            }
          ]
        },
        {
          "id": "drive",
          "title": "The drive",
          "scene": "drive",
          "questions": [
            {
              "path": "scene",
              "label": "Scene",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "temple",
                "hills",
                "night",
                "beach"
              ],
              "optionLabels": {
                "classic": "Palm road",
                "temple": "Temple street",
                "hills": "Tea hills",
                "night": "Night lamps",
                "beach": "Beach road"
              }
            },
            {
              "path": "outfit",
              "label": "Outfit",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "veshti",
                "suit"
              ],
              "optionLabels": {
                "veshti": "Veshti & saree",
                "suit": "Suit & lehenga"
              }
            }
          ]
        },
        {
          "id": "details",
          "title": "Date & names",
          "scene": "details",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 14
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 14
            },
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "venueEn",
              "label": "Venue and town",
              "type": "text",
              "required": true,
              "maxLength": 60
            },
            {
              "path": "intro1",
              "label": "First small line",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "intro2",
              "label": "Second small line",
              "type": "text",
              "required": false,
              "maxLength": 22
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "scene": "classic",
      "outfit": "veshti",
      "groomEn": "",
      "brideEn": "",
      "weddingDate": "",
      "venueEn": "",
      "title": "Save the Date",
      "intro1": "for the wedding",
      "intro2": "celebration of",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "scene": "classic",
      "outfit": "veshti",
      "groomEn": "Arjun",
      "brideEn": "Meera",
      "weddingDate": "2027-02-12",
      "venueEn": "Sri Balaji Kalyana Mandapam",
      "title": "Save the Date",
      "intro1": "for the wedding",
      "intro2": "celebration of",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "scene": "drive",
      "outfit": "drive",
      "title": "title",
      "intro1": "details",
      "intro2": "details",
      "groomEn": "details",
      "brideEn": "details",
      "weddingDate": "details",
      "venueEn": "details"
    },
    "photoSlots": [],
    "duration": 20,
    "kind": "page"
  },
  {
    "id": "film-temple-v1",
    "design": "temple",
    "name": "Kalyana Deepam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "temple-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Temple Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "lang",
              "label": "Lang",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "both",
                "ta",
                "en"
              ],
              "optionLabels": {
                "both": "Tamil + English",
                "ta": "Tamil only",
                "en": "English only"
              }
            },
            {
              "path": "titleTa",
              "label": "Tamil title",
              "type": "text",
              "required": false,
              "maxLength": 28
            },
            {
              "path": "titleEn",
              "label": "English title",
              "type": "text",
              "required": false,
              "maxLength": 30
            },
            {
              "path": "sizeTitle",
              "label": "Size Title",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "blessing",
          "title": "Blessing",
          "scene": "blessing",
          "questions": [
            {
              "path": "blessingTa1",
              "label": "Tamil line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 30
            },
            {
              "path": "blessingTa2",
              "label": "Tamil line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 30
            },
            {
              "path": "blessingEn",
              "label": "English line",
              "type": "textarea",
              "required": false,
              "maxLength": 64
            },
            {
              "path": "sizeBlessing",
              "label": "Size Blessing",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "couple",
          "title": "Couple",
          "scene": "couple",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom (English)",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomTa",
              "label": "Groom (Tamil)",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomDegree",
              "label": "Groom's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride (English)",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideTa",
              "label": "Bride (Tamil)",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideDegree",
              "label": "Bride's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "degNames",
              "label": "Deg Names",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "sizeCouple",
              "label": "Size Couple",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "date",
          "title": "Date",
          "scene": "date",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding (muhurtham) date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "sizeDate",
              "label": "Size Date",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "events",
          "title": "Events",
          "scene": "events",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "sizeEvents",
              "label": "Size Events",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "venue",
          "title": "Venue",
          "scene": "venue",
          "questions": [
            {
              "path": "venueEn",
              "label": "Venue name (English)",
              "type": "text",
              "required": true,
              "maxLength": 30
            },
            {
              "path": "venueLineEn",
              "label": "Area & town (English)",
              "type": "text",
              "required": true,
              "maxLength": 60
            },
            {
              "path": "venueTa",
              "label": "Venue in Tamil",
              "type": "textarea",
              "required": true,
              "maxLength": 46
            },
            {
              "path": "sizeVenue",
              "label": "Size Venue",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "closing",
          "title": "Closing",
          "scene": "closing",
          "questions": [
            {
              "path": "closingTa1",
              "label": "Tamil line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 30
            },
            {
              "path": "closingTa2",
              "label": "Tamil line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 30
            },
            {
              "path": "closingEn",
              "label": "English line",
              "type": "textarea",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "sizeClosing",
              "label": "Size Closing",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "lang": "both",
      "titleTa": "திருமண அழைப்பிதழ்",
      "titleEn": "WEDDING INVITATION",
      "sizeTitle": "100",
      "blessingTa1": "இறைவன் அருளாலும்",
      "blessingTa2": "பெரியோர்களின் ஆசியுடனும்",
      "blessingEn": "With the grace of God & the blessings of our elders",
      "sizeBlessing": "100",
      "groomEn": "",
      "groomTa": "",
      "groomDegree": "",
      "brideEn": "",
      "brideTa": "",
      "brideDegree": "",
      "degNames": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "sizeDate": "100",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "sizeEvents": "100",
      "venueEn": "",
      "venueLineEn": "",
      "venueTa": "",
      "sizeVenue": "100",
      "closingTa1": "உங்கள் வருகையை",
      "closingTa2": "அன்புடன் எதிர்பார்க்கிறோம்",
      "closingEn": "Your presence is our blessing",
      "sizeClosing": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "lang": "both",
      "titleTa": "திருமண அழைப்பிதழ்",
      "titleEn": "WEDDING INVITATION",
      "sizeTitle": "100",
      "blessingTa1": "இறைவன் அருளாலும்",
      "blessingTa2": "பெரியோர்களின் ஆசியுடனும்",
      "blessingEn": "With the grace of God & the blessings of our elders",
      "sizeBlessing": "100",
      "groomEn": "Arjun",
      "groomTa": "அர்ஜுன்",
      "groomDegree": "",
      "brideEn": "Priya",
      "brideTa": "பிரியா",
      "brideDegree": "",
      "degNames": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "weddingDate": "2026-09-28",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "sizeDate": "100",
      "receptionDate": "2026-09-27",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "sizeEvents": "100",
      "venueEn": "Manickam Mahal",
      "venueLineEn": "Salai Nagar, Thiruppattur",
      "venueTa": "மாணிக்கம் மஹால், சாலை நகர், திருப்பத்தூர்",
      "sizeVenue": "100",
      "closingTa1": "உங்கள் வருகையை",
      "closingTa2": "அன்புடன் எதிர்பார்க்கிறோம்",
      "closingEn": "Your presence is our blessing",
      "sizeClosing": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "degNames": "couple",
      "titleTa": "title",
      "titleEn": "title",
      "blessingTa1": "blessing",
      "blessingTa2": "blessing",
      "blessingEn": "blessing",
      "closingTa1": "closing",
      "closingTa2": "closing",
      "closingEn": "closing",
      "groomEn": "couple",
      "groomTa": "couple",
      "brideEn": "couple",
      "brideTa": "couple",
      "order": "couple",
      "groomDegree": "couple",
      "brideDegree": "couple",
      "lang": "title",
      "weddingDate": "date",
      "muhurthamFrom": "date",
      "muhurthamTo": "date",
      "receptionDate": "events",
      "receptionFrom": "events",
      "receptionTo": "events",
      "venueEn": "venue",
      "venueLineEn": "venue",
      "venueTa": "venue",
      "fontSet": "title",
      "sizeTitle": "title",
      "sizeBlessing": "blessing",
      "sizeCouple": "couple",
      "sizeDate": "date",
      "sizeEvents": "events",
      "sizeVenue": "venue",
      "sizeClosing": "closing"
    },
    "photoSlots": [],
    "duration": 39,
    "kind": "webgl"
  },
  {
    "id": "film-vector-v1",
    "design": "vector",
    "name": "Mangalam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "vector-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "titleScript",
              "label": "Title in script",
              "type": "text",
              "required": false,
              "maxLength": 20
            },
            {
              "path": "titleCaps",
              "label": "Title in capitals",
              "type": "text",
              "required": false,
              "maxLength": 26
            },
            {
              "path": "sizeTitle",
              "label": "Size Title",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "couple",
          "title": "Couple",
          "scene": "couple",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomDegree",
              "label": "Groom's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideDegree",
              "label": "Bride's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "degNames",
              "label": "Deg Names",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "degInvite",
              "label": "Deg Invite",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "degThanks",
              "label": "Deg Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "sizeCouple",
              "label": "Size Couple",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Temple Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "blessing1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessing2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "request1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "request2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name",
              "type": "text",
              "required": true,
              "maxLength": 30
            },
            {
              "path": "venueLineEn",
              "label": "Area & town",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "sizeWedding",
              "label": "Size Wedding",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 58
            },
            {
              "path": "sizeReception",
              "label": "Size Reception",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you line (script)",
              "type": "text",
              "required": false,
              "maxLength": 20
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 60
            },
            {
              "path": "sizeThanks",
              "label": "Size Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "sizeTitle": "100",
      "groomEn": "",
      "groomDegree": "",
      "brideEn": "",
      "brideDegree": "",
      "degNames": "show",
      "degInvite": "show",
      "degThanks": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "groomParents": "",
      "brideParents": "",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "sizeInvitation": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "sizeWedding": "100",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "sizeTitle": "100",
      "groomEn": "Arjun",
      "groomDegree": "",
      "brideEn": "Priya",
      "brideDegree": "",
      "degNames": "show",
      "degInvite": "show",
      "degThanks": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "groomParents": "Mr. R. Raman & Mrs. Lakshmi Raman",
      "brideParents": "Mr. S. Kumar & Mrs. Meena Kumar",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "sizeInvitation": "100",
      "weddingDate": "2026-09-28",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Manickam Mahal",
      "venueLineEn": "Salai Nagar, Thiruppattur",
      "sizeWedding": "100",
      "receptionDate": "2026-09-27",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "degNames": "couple",
      "degInvite": "couple",
      "degThanks": "couple",
      "titleScript": "title",
      "titleCaps": "title",
      "groomEn": "couple",
      "brideEn": "couple",
      "order": "couple",
      "groomDegree": "couple",
      "brideDegree": "couple",
      "blessing1": "invitation",
      "blessing2": "invitation",
      "groomParents": "invitation",
      "brideParents": "invitation",
      "request1": "invitation",
      "request2": "invitation",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "thanks": "thanks",
      "thanksLine": "thanks",
      "fontSet": "invitation",
      "sizeTitle": "title",
      "sizeCouple": "couple",
      "sizeInvitation": "invitation",
      "sizeWedding": "wedding",
      "sizeReception": "reception",
      "sizeThanks": "thanks"
    },
    "photoSlots": [],
    "duration": 40.6,
    "kind": "webgl"
  },
  {
    "id": "film-garden-v1",
    "design": "garden",
    "name": "Wisteria Garden",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "garden-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "titleScript",
              "label": "Title in script",
              "type": "text",
              "required": false,
              "maxLength": 20
            },
            {
              "path": "titleCaps",
              "label": "Title in capitals",
              "type": "text",
              "required": false,
              "maxLength": 26
            },
            {
              "path": "sizeTitle",
              "label": "Size Title",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "couple",
          "title": "Couple",
          "scene": "couple",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomDegree",
              "label": "Groom's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideDegree",
              "label": "Bride's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "degNames",
              "label": "Deg Names",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "degInvite",
              "label": "Deg Invite",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "degThanks",
              "label": "Deg Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "sizeCouple",
              "label": "Size Couple",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Temple Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "blessing1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessing2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "request1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "request2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name",
              "type": "text",
              "required": true,
              "maxLength": 30
            },
            {
              "path": "venueLineEn",
              "label": "Area & town",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "sizeWedding",
              "label": "Size Wedding",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 58
            },
            {
              "path": "sizeReception",
              "label": "Size Reception",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you line (script)",
              "type": "text",
              "required": false,
              "maxLength": 20
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 60
            },
            {
              "path": "sizeThanks",
              "label": "Size Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "sizeTitle": "100",
      "groomEn": "",
      "groomDegree": "",
      "brideEn": "",
      "brideDegree": "",
      "degNames": "show",
      "degInvite": "show",
      "degThanks": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "groomParents": "",
      "brideParents": "",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "sizeInvitation": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "sizeWedding": "100",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "sizeTitle": "100",
      "groomEn": "Arjun",
      "groomDegree": "",
      "brideEn": "Priya",
      "brideDegree": "",
      "degNames": "show",
      "degInvite": "show",
      "degThanks": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "groomParents": "Mr. R. Raman & Mrs. Lakshmi Raman",
      "brideParents": "Mr. S. Kumar & Mrs. Meena Kumar",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "sizeInvitation": "100",
      "weddingDate": "2026-09-28",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Manickam Mahal",
      "venueLineEn": "Salai Nagar, Thiruppattur",
      "sizeWedding": "100",
      "receptionDate": "2026-09-27",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "degNames": "couple",
      "degInvite": "couple",
      "degThanks": "couple",
      "titleScript": "title",
      "titleCaps": "title",
      "groomEn": "couple",
      "brideEn": "couple",
      "order": "couple",
      "groomDegree": "couple",
      "brideDegree": "couple",
      "blessing1": "invitation",
      "blessing2": "invitation",
      "groomParents": "invitation",
      "brideParents": "invitation",
      "request1": "invitation",
      "request2": "invitation",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "thanks": "thanks",
      "thanksLine": "thanks",
      "fontSet": "invitation",
      "sizeTitle": "title",
      "sizeCouple": "couple",
      "sizeInvitation": "invitation",
      "sizeWedding": "wedding",
      "sizeReception": "reception",
      "sizeThanks": "thanks"
    },
    "photoSlots": [],
    "duration": 40.6,
    "kind": "webgl"
  },
  {
    "id": "film-tiles-v1",
    "design": "tiles",
    "name": "Word Tiles",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "tiles-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": []
        },
        {
          "id": "couple",
          "title": "Couple",
          "scene": "couple",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Tiles Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "groomEn",
              "label": "Groom's first name",
              "type": "text",
              "required": true,
              "maxLength": 12
            },
            {
              "path": "groomDegree",
              "label": "Groom's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride's first name",
              "type": "text",
              "required": true,
              "maxLength": 12
            },
            {
              "path": "brideDegree",
              "label": "Bride's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "blessing1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessing2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "request1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "request2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name",
              "type": "text",
              "required": true,
              "maxLength": 30
            },
            {
              "path": "venueLineEn",
              "label": "Area & town",
              "type": "text",
              "required": true,
              "maxLength": 40
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 58
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanksLine",
              "label": "Line under THANK ♥ YOU",
              "type": "textarea",
              "required": false,
              "maxLength": 60
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "groomEn": "",
      "groomDegree": "",
      "brideEn": "",
      "brideDegree": "",
      "order": "groom_first",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "groomParents": "",
      "brideParents": "",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "thanksLine": "We can't wait to celebrate with you",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "groomEn": "Arjun",
      "groomDegree": "",
      "brideEn": "Priya",
      "brideDegree": "",
      "order": "groom_first",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "groomParents": "Mr. R. Raman & Mrs. Lakshmi Raman",
      "brideParents": "Mr. S. Kumar & Mrs. Meena Kumar",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "weddingDate": "2026-09-28",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Manickam Mahal",
      "venueLineEn": "Salai Nagar, Thiruppattur",
      "receptionDate": "2026-09-27",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "",
      "thanksLine": "We can't wait to celebrate with you",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "couple",
      "groomEn": "couple",
      "groomDegree": "couple",
      "brideEn": "couple",
      "brideDegree": "couple",
      "order": "couple",
      "blessing1": "invitation",
      "blessing2": "invitation",
      "groomParents": "invitation",
      "brideParents": "invitation",
      "request1": "invitation",
      "request2": "invitation",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "thanksLine": "thanks"
    },
    "photoSlots": [],
    "duration": 57.36,
    "kind": "webgl"
  },
  {
    "id": "film-bollywood-v1",
    "design": "bollywood",
    "name": "Bollywood Blockbuster",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "bollywood-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "titleScript",
              "label": "Title (painted letters)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "titleCaps",
              "label": "On the red ribbon",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "presents",
              "label": "Line above the title",
              "type": "text",
              "required": false,
              "maxLength": 40
            },
            {
              "path": "sizeTitle",
              "label": "Size Title",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "couple",
          "title": "Couple",
          "scene": "couple",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomDegree",
              "label": "Groom's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideDegree",
              "label": "Bride's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "degNames",
              "label": "Deg Names",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "degInvite",
              "label": "Deg Invite",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "sizeCouple",
              "label": "Size Couple",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Filmi Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "blessing1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessing2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "request1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "request2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "shows",
          "title": "Shows",
          "scene": "shows",
          "questions": [
            {
              "path": "mehendiDate",
              "label": "Mehendi date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "mehendiFrom",
              "label": "Mehendi From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "mehendiTo",
              "label": "Mehendi To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "mehendiVenue",
              "label": "Mehendi venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "haldiDate",
              "label": "Haldi date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "haldiFrom",
              "label": "Haldi From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "haldiTo",
              "label": "Haldi To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "haldiVenue",
              "label": "Haldi venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "sangeetDate",
              "label": "Sangeet date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "sangeetFrom",
              "label": "Sangeet From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "sangeetTo",
              "label": "Sangeet To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "sangeetVenue",
              "label": "Sangeet venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "sizeShows",
              "label": "Size Shows",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name",
              "type": "text",
              "required": true,
              "maxLength": 30
            },
            {
              "path": "venueLineEn",
              "label": "Area & town",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "sizeWedding",
              "label": "Size Wedding",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 58
            },
            {
              "path": "sizeReception",
              "label": "Size Reception",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you title (painted letters)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 60
            },
            {
              "path": "sizeThanks",
              "label": "Size Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "presents": "THE FAMILIES PROUDLY PRESENT",
      "sizeTitle": "100",
      "groomEn": "",
      "groomDegree": "",
      "brideEn": "",
      "brideDegree": "",
      "degNames": "show",
      "degInvite": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "groomParents": "",
      "brideParents": "",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "sizeInvitation": "100",
      "mehendiDate": "",
      "mehendiFrom": "",
      "mehendiTo": "",
      "mehendiVenue": "",
      "haldiDate": "",
      "haldiFrom": "",
      "haldiTo": "",
      "haldiVenue": "",
      "sangeetDate": "",
      "sangeetFrom": "",
      "sangeetTo": "",
      "sangeetVenue": "",
      "sizeShows": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "sizeWedding": "100",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "presents": "THE FAMILIES PROUDLY PRESENT",
      "sizeTitle": "100",
      "groomEn": "Arjun",
      "groomDegree": "",
      "brideEn": "Priya",
      "brideDegree": "",
      "degNames": "show",
      "degInvite": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "groomParents": "Mr. R. Raman & Mrs. Lakshmi Raman",
      "brideParents": "Mr. S. Kumar & Mrs. Meena Kumar",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "sizeInvitation": "100",
      "mehendiDate": "2026-09-25",
      "mehendiFrom": "16:00",
      "mehendiTo": "",
      "mehendiVenue": "Bride's residence, Thiruppattur",
      "haldiDate": "2026-09-26",
      "haldiFrom": "09:00",
      "haldiTo": "",
      "haldiVenue": "Manickam Mahal, Thiruppattur",
      "sangeetDate": "2026-09-26",
      "sangeetFrom": "19:00",
      "sangeetTo": "",
      "sangeetVenue": "Manickam Mahal, Thiruppattur",
      "sizeShows": "100",
      "weddingDate": "2026-09-28",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Manickam Mahal",
      "venueLineEn": "Salai Nagar, Thiruppattur",
      "sizeWedding": "100",
      "receptionDate": "2026-09-27",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "degNames": "couple",
      "degInvite": "couple",
      "titleScript": "title",
      "titleCaps": "title",
      "presents": "title",
      "groomEn": "couple",
      "brideEn": "couple",
      "order": "couple",
      "groomDegree": "couple",
      "brideDegree": "couple",
      "blessing1": "invitation",
      "blessing2": "invitation",
      "groomParents": "invitation",
      "brideParents": "invitation",
      "request1": "invitation",
      "request2": "invitation",
      "mehendiDate": "shows",
      "mehendiFrom": "shows",
      "mehendiTo": "shows",
      "mehendiVenue": "shows",
      "haldiDate": "shows",
      "haldiFrom": "shows",
      "haldiTo": "shows",
      "haldiVenue": "shows",
      "sangeetDate": "shows",
      "sangeetFrom": "shows",
      "sangeetTo": "shows",
      "sangeetVenue": "shows",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "thanks": "thanks",
      "thanksLine": "thanks",
      "fontSet": "invitation",
      "sizeTitle": "title",
      "sizeCouple": "couple",
      "sizeInvitation": "invitation",
      "sizeShows": "shows",
      "sizeWedding": "wedding",
      "sizeReception": "reception",
      "sizeThanks": "thanks"
    },
    "photoSlots": [],
    "duration": 50.8,
    "kind": "webgl"
  },
  {
    "id": "film-truckart-v1",
    "design": "truckart",
    "name": "Truck-Art Mela",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "truckart-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "titleScript",
              "label": "Title (truck lettering)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "titleCaps",
              "label": "Under the title",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "sizeTitle",
              "label": "Size Title",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "couple",
          "title": "Couple",
          "scene": "couple",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomDegree",
              "label": "Groom's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideDegree",
              "label": "Bride's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "degNames",
              "label": "Deg Names",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "degInvite",
              "label": "Deg Invite",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "sizeCouple",
              "label": "Size Couple",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Truck Classic",
                "royal": "Royal Serif",
                "graceful": "Painted Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "blessing1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessing2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "request1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "request2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "shows",
          "title": "Events",
          "scene": "shows",
          "questions": [
            {
              "path": "mehendiDate",
              "label": "Mehendi date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "mehendiFrom",
              "label": "Mehendi From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "mehendiTo",
              "label": "Mehendi To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "mehendiVenue",
              "label": "Mehendi venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "haldiDate",
              "label": "Haldi date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "haldiFrom",
              "label": "Haldi From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "haldiTo",
              "label": "Haldi To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "haldiVenue",
              "label": "Haldi venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "sangeetDate",
              "label": "Sangeet date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "sangeetFrom",
              "label": "Sangeet From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "sangeetTo",
              "label": "Sangeet To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "sangeetVenue",
              "label": "Sangeet venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "sizeShows",
              "label": "Size Shows",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name",
              "type": "text",
              "required": true,
              "maxLength": 30
            },
            {
              "path": "venueLineEn",
              "label": "Area & town",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "sizeWedding",
              "label": "Size Wedding",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 58
            },
            {
              "path": "sizeReception",
              "label": "Size Reception",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you title (truck lettering)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 55
            },
            {
              "path": "sizeThanks",
              "label": "Size Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "sizeTitle": "100",
      "groomEn": "",
      "groomDegree": "",
      "brideEn": "",
      "brideDegree": "",
      "degNames": "show",
      "degInvite": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "groomParents": "",
      "brideParents": "",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "sizeInvitation": "100",
      "mehendiDate": "",
      "mehendiFrom": "",
      "mehendiTo": "",
      "mehendiVenue": "",
      "haldiDate": "",
      "haldiFrom": "",
      "haldiTo": "",
      "haldiVenue": "",
      "sangeetDate": "",
      "sangeetFrom": "",
      "sangeetTo": "",
      "sangeetVenue": "",
      "sizeShows": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "sizeWedding": "100",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "sizeTitle": "100",
      "groomEn": "Arjun",
      "groomDegree": "",
      "brideEn": "Priya",
      "brideDegree": "",
      "degNames": "show",
      "degInvite": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "groomParents": "Mr. R. Raman & Mrs. Lakshmi Raman",
      "brideParents": "Mr. S. Kumar & Mrs. Meena Kumar",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "sizeInvitation": "100",
      "mehendiDate": "2026-09-25",
      "mehendiFrom": "16:00",
      "mehendiTo": "",
      "mehendiVenue": "Bride's residence, Thiruppattur",
      "haldiDate": "2026-09-26",
      "haldiFrom": "09:00",
      "haldiTo": "",
      "haldiVenue": "Manickam Mahal, Thiruppattur",
      "sangeetDate": "2026-09-26",
      "sangeetFrom": "19:00",
      "sangeetTo": "",
      "sangeetVenue": "Manickam Mahal, Thiruppattur",
      "sizeShows": "100",
      "weddingDate": "2026-09-28",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Manickam Mahal",
      "venueLineEn": "Salai Nagar, Thiruppattur",
      "sizeWedding": "100",
      "receptionDate": "2026-09-27",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "degNames": "couple",
      "degInvite": "couple",
      "titleScript": "title",
      "titleCaps": "title",
      "groomEn": "couple",
      "brideEn": "couple",
      "order": "couple",
      "groomDegree": "couple",
      "brideDegree": "couple",
      "blessing1": "invitation",
      "blessing2": "invitation",
      "groomParents": "invitation",
      "brideParents": "invitation",
      "request1": "invitation",
      "request2": "invitation",
      "mehendiDate": "shows",
      "mehendiFrom": "shows",
      "mehendiTo": "shows",
      "mehendiVenue": "shows",
      "haldiDate": "shows",
      "haldiFrom": "shows",
      "haldiTo": "shows",
      "haldiVenue": "shows",
      "sangeetDate": "shows",
      "sangeetFrom": "shows",
      "sangeetTo": "shows",
      "sangeetVenue": "shows",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "thanks": "thanks",
      "thanksLine": "thanks",
      "fontSet": "invitation",
      "sizeTitle": "title",
      "sizeCouple": "couple",
      "sizeInvitation": "invitation",
      "sizeShows": "shows",
      "sizeWedding": "wedding",
      "sizeReception": "reception",
      "sizeThanks": "thanks"
    },
    "photoSlots": [],
    "duration": 52.8,
    "kind": "webgl"
  },
  {
    "id": "film-kovil-v1",
    "design": "kovil",
    "name": "Kovil Kalyanam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "kovil-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Kovil Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "lang",
              "label": "Lang",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "en",
                "ta"
              ],
              "optionLabels": {
                "en": "English",
                "ta": "Tamil"
              }
            },
            {
              "path": "titleScript",
              "label": "Title (script)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "titleCaps",
              "label": "Under the title",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "titleScriptTa",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "titleCapsTa",
              "label": "Under the title",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "sizeTitle",
              "label": "Size Title",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "couple",
          "title": "Couple",
          "scene": "couple",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomTa",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomDegree",
              "label": "Groom's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideTa",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideDegree",
              "label": "Bride's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "degNames",
              "label": "Deg Names",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "degInvite",
              "label": "Deg Invite",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "degThanks",
              "label": "Deg Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "sizeCouple",
              "label": "Size Couple",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "blessing1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessing2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessingTa1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 30
            },
            {
              "path": "blessingTa2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 30
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 60
            },
            {
              "path": "groomParentsTa",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 60
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 60
            },
            {
              "path": "brideParentsTa",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 60
            },
            {
              "path": "request1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "request2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "requestTa",
              "label": "Line",
              "type": "textarea",
              "required": false,
              "maxLength": 30
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name (the hall)",
              "type": "text",
              "required": true,
              "maxLength": 44
            },
            {
              "path": "venueLineEn",
              "label": "Area & town",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "venueTa",
              "label": "Venue (the hall's name, then a comma, then the area and town)",
              "type": "textarea",
              "required": true,
              "maxLength": 70
            },
            {
              "path": "sizeWedding",
              "label": "Size Wedding",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 80
            },
            {
              "path": "receptionVenueTa",
              "label": "Reception venue (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 70
            },
            {
              "path": "sizeReception",
              "label": "Size Reception",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you title (script)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 60
            },
            {
              "path": "thanksTa",
              "label": "Thank-you title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLineTa",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 60
            },
            {
              "path": "sizeThanks",
              "label": "Size Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "lang": "en",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "titleScriptTa": "திருமண",
      "titleCapsTa": "அழைப்பிதழ்",
      "sizeTitle": "100",
      "groomEn": "",
      "groomTa": "",
      "groomDegree": "",
      "brideEn": "",
      "brideTa": "",
      "brideDegree": "",
      "degNames": "show",
      "degInvite": "show",
      "degThanks": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "blessingTa1": "இறைவன் அருளாலும்",
      "blessingTa2": "பெரியோர்களின் ஆசியுடனும்",
      "groomParents": "",
      "groomParentsTa": "",
      "brideParents": "",
      "brideParentsTa": "",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "requestTa": "இவர்களின் அன்பு மகன்",
      "sizeInvitation": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "venueTa": "",
      "sizeWedding": "100",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueTa": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "thanksTa": "நன்றி",
      "thanksLineTa": "உங்கள் வருகையை அன்புடன் எதிர்பார்க்கிறோம்",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "lang": "en",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "titleScriptTa": "திருமண",
      "titleCapsTa": "அழைப்பிதழ்",
      "sizeTitle": "100",
      "groomEn": "Arjun",
      "groomTa": "அர்ஜுன்",
      "groomDegree": "",
      "brideEn": "Priya",
      "brideTa": "பிரியா",
      "brideDegree": "",
      "degNames": "show",
      "degInvite": "show",
      "degThanks": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "blessingTa1": "இறைவன் அருளாலும்",
      "blessingTa2": "பெரியோர்களின் ஆசியுடனும்",
      "groomParents": "Mr. R. Raman & Mrs. Lakshmi Raman",
      "groomParentsTa": "திரு. ரா. ராமன் – திருமதி. லட்சுமி",
      "brideParents": "Mr. S. Kumar & Mrs. Meena Kumar",
      "brideParentsTa": "திரு. சு. குமார்",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "requestTa": "இவர்களின் அன்பு மகன்",
      "sizeInvitation": "100",
      "weddingDate": "2026-09-28",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Manickam Mahal",
      "venueLineEn": "Salai Nagar, Thiruppattur",
      "venueTa": "மாணிக்கம் மஹால், திருப்பத்தூர்",
      "sizeWedding": "100",
      "receptionDate": "2026-09-27",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueTa": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "thanksTa": "நன்றி",
      "thanksLineTa": "உங்கள் வருகையை அன்புடன் எதிர்பார்க்கிறோம்",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "degNames": "couple",
      "degInvite": "couple",
      "degThanks": "couple",
      "lang": "title",
      "titleScript": "title",
      "titleCaps": "title",
      "titleScriptTa": "title",
      "titleCapsTa": "title",
      "groomEn": "couple",
      "groomTa": "couple",
      "brideEn": "couple",
      "brideTa": "couple",
      "order": "couple",
      "groomDegree": "couple",
      "brideDegree": "couple",
      "blessing1": "invitation",
      "blessing2": "invitation",
      "blessingTa1": "invitation",
      "blessingTa2": "invitation",
      "groomParents": "invitation",
      "groomParentsTa": "invitation",
      "brideParents": "invitation",
      "brideParentsTa": "invitation",
      "request1": "invitation",
      "request2": "invitation",
      "requestTa": "invitation",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "venueTa": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "receptionVenueTa": "reception",
      "thanks": "thanks",
      "thanksLine": "thanks",
      "thanksTa": "thanks",
      "thanksLineTa": "thanks",
      "sizeTitle": "title",
      "sizeCouple": "couple",
      "sizeInvitation": "invitation",
      "sizeWedding": "wedding",
      "sizeReception": "reception",
      "sizeThanks": "thanks"
    },
    "photoSlots": [],
    "duration": 40.8,
    "kind": "webgl"
  },
  {
    "id": "film-royal-v1",
    "design": "royal",
    "name": "Royal Rajwada Utsav",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "royal-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "titleScript",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "titleCaps",
              "label": "Under the title",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "sizeTitle",
              "label": "Size Title",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "couple",
          "title": "Couple",
          "scene": "couple",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomDegree",
              "label": "Groom's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideDegree",
              "label": "Bride's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "degNames",
              "label": "Deg Names",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "degInvite",
              "label": "Deg Invite",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "sizeCouple",
              "label": "Size Couple",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Royal Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "blessing1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessing2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "request1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "request2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "shows",
          "title": "Events",
          "scene": "shows",
          "questions": [
            {
              "path": "mehendiDate",
              "label": "Mehendi date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "mehendiFrom",
              "label": "Mehendi From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "mehendiTo",
              "label": "Mehendi To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "mehendiVenue",
              "label": "Mehendi venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "haldiDate",
              "label": "Haldi date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "haldiFrom",
              "label": "Haldi From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "haldiTo",
              "label": "Haldi To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "haldiVenue",
              "label": "Haldi venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "sangeetDate",
              "label": "Sangeet date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "sangeetFrom",
              "label": "Sangeet From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "sangeetTo",
              "label": "Sangeet To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "sangeetVenue",
              "label": "Sangeet venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "sizeShows",
              "label": "Size Shows",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name",
              "type": "text",
              "required": true,
              "maxLength": 30
            },
            {
              "path": "venueLineEn",
              "label": "Area & town",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "sizeWedding",
              "label": "Size Wedding",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 58
            },
            {
              "path": "sizeReception",
              "label": "Size Reception",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 55
            },
            {
              "path": "sizeThanks",
              "label": "Size Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "sizeTitle": "100",
      "groomEn": "",
      "groomDegree": "",
      "brideEn": "",
      "brideDegree": "",
      "degNames": "show",
      "degInvite": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "groomParents": "",
      "brideParents": "",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "sizeInvitation": "100",
      "mehendiDate": "",
      "mehendiFrom": "",
      "mehendiTo": "",
      "mehendiVenue": "",
      "haldiDate": "",
      "haldiFrom": "",
      "haldiTo": "",
      "haldiVenue": "",
      "sangeetDate": "",
      "sangeetFrom": "",
      "sangeetTo": "",
      "sangeetVenue": "",
      "sizeShows": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "sizeWedding": "100",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "sizeTitle": "100",
      "groomEn": "Arjun",
      "groomDegree": "",
      "brideEn": "Priya",
      "brideDegree": "",
      "degNames": "show",
      "degInvite": "show",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "groomParents": "Mr. R. Raman & Mrs. Lakshmi Raman",
      "brideParents": "Mr. S. Kumar & Mrs. Meena Kumar",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "sizeInvitation": "100",
      "mehendiDate": "2026-09-25",
      "mehendiFrom": "16:00",
      "mehendiTo": "",
      "mehendiVenue": "Bride's residence, Thiruppattur",
      "haldiDate": "2026-09-26",
      "haldiFrom": "09:00",
      "haldiTo": "",
      "haldiVenue": "Manickam Mahal, Thiruppattur",
      "sangeetDate": "2026-09-26",
      "sangeetFrom": "19:00",
      "sangeetTo": "",
      "sangeetVenue": "Manickam Mahal, Thiruppattur",
      "sizeShows": "100",
      "weddingDate": "2026-09-28",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Manickam Mahal",
      "venueLineEn": "Salai Nagar, Thiruppattur",
      "sizeWedding": "100",
      "receptionDate": "2026-09-27",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "degNames": "couple",
      "degInvite": "couple",
      "titleScript": "title",
      "titleCaps": "title",
      "groomEn": "couple",
      "brideEn": "couple",
      "order": "couple",
      "groomDegree": "couple",
      "brideDegree": "couple",
      "blessing1": "invitation",
      "blessing2": "invitation",
      "groomParents": "invitation",
      "brideParents": "invitation",
      "request1": "invitation",
      "request2": "invitation",
      "mehendiDate": "shows",
      "mehendiFrom": "shows",
      "mehendiTo": "shows",
      "mehendiVenue": "shows",
      "haldiDate": "shows",
      "haldiFrom": "shows",
      "haldiTo": "shows",
      "haldiVenue": "shows",
      "sangeetDate": "shows",
      "sangeetFrom": "shows",
      "sangeetTo": "shows",
      "sangeetVenue": "shows",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "thanks": "thanks",
      "thanksLine": "thanks",
      "fontSet": "invitation",
      "sizeTitle": "title",
      "sizeCouple": "couple",
      "sizeInvitation": "invitation",
      "sizeShows": "shows",
      "sizeWedding": "wedding",
      "sizeReception": "reception",
      "sizeThanks": "thanks"
    },
    "photoSlots": [],
    "duration": 52.8,
    "kind": "webgl"
  },
  {
    "id": "film-kerala-v1",
    "design": "kerala",
    "name": "Kerala Kalyanam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "kerala-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Kerala Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "lang",
              "label": "Lang",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "en",
                "ml"
              ],
              "optionLabels": {
                "en": "English",
                "ml": "Malayalam"
              }
            },
            {
              "path": "titleScript",
              "label": "Title (script)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "titleCaps",
              "label": "Under the title",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "titleScriptMl",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "titleCapsMl",
              "label": "Under the title",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "sizeTitle",
              "label": "Size Title",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "couple",
          "title": "Couple",
          "scene": "couple",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomMl",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomDegree",
              "label": "Groom's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 55
            },
            {
              "path": "groomParentsMl",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 44
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideMl",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideDegree",
              "label": "Bride's degree (optional)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "degNames",
              "label": "Deg Names",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "degIntro",
              "label": "Deg Intro",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "degInvite",
              "label": "Deg Invite",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "degThanks",
              "label": "Deg Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "show",
                "hide"
              ],
              "optionLabels": {
                "show": "Show",
                "hide": "Hide"
              }
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 55
            },
            {
              "path": "brideParentsMl",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 44
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "sizeCouple",
              "label": "Size Couple",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "blessing1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessing2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessingMl1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 32
            },
            {
              "path": "blessingMl2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 32
            },
            {
              "path": "request1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "request2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "requestMl",
              "label": "Line",
              "type": "textarea",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name (the hall)",
              "type": "text",
              "required": true,
              "maxLength": 44
            },
            {
              "path": "venueLineEn",
              "label": "Area & town",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "venueMl",
              "label": "Venue (the hall's name, then a comma, then the area and town)",
              "type": "textarea",
              "required": true,
              "maxLength": 70
            },
            {
              "path": "sizeWedding",
              "label": "Size Wedding",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 80
            },
            {
              "path": "receptionVenueMl",
              "label": "Reception venue (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 70
            },
            {
              "path": "sizeReception",
              "label": "Size Reception",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you title (script)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "thanksMl",
              "label": "Thank-you title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLineMl",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 60
            },
            {
              "path": "sizeThanks",
              "label": "Size Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "lang": "en",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "titleScriptMl": "വിവാഹ",
      "titleCapsMl": "ക്ഷണക്കത്ത്",
      "sizeTitle": "100",
      "groomEn": "",
      "groomMl": "",
      "groomDegree": "",
      "groomParents": "",
      "groomParentsMl": "",
      "brideEn": "",
      "brideMl": "",
      "brideDegree": "",
      "degNames": "show",
      "degIntro": "hide",
      "degInvite": "hide",
      "degThanks": "hide",
      "brideParents": "",
      "brideParentsMl": "",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "blessingMl1": "ഈശ്വരാനുഗ്രഹത്താലും",
      "blessingMl2": "ഗുരുജനങ്ങളുടെ ആശീർവാദത്തോടെയും",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "requestMl": "ദമ്പതികളുടെ മകൻ",
      "sizeInvitation": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "venueMl": "",
      "sizeWedding": "100",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueMl": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "thanksMl": "നന്ദി",
      "thanksLineMl": "നിങ്ങളുടെ സാന്നിധ്യം ഹൃദയപൂർവ്വം പ്രതീക്ഷിക്കുന്നു",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "lang": "en",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "titleScriptMl": "വിവാഹ",
      "titleCapsMl": "ക്ഷണക്കത്ത്",
      "sizeTitle": "100",
      "groomEn": "Arjun",
      "groomMl": "അർജുൻ",
      "groomDegree": "",
      "groomParents": "Mr. R. Raman & Mrs. Lakshmi Raman",
      "groomParentsMl": "ശ്രീ. ആർ. രാമൻ – ശ്രീമതി ലക്ഷ്മി രാമൻ",
      "brideEn": "Priya",
      "brideMl": "പ്രിയ",
      "brideDegree": "",
      "degNames": "show",
      "degIntro": "hide",
      "degInvite": "hide",
      "degThanks": "hide",
      "brideParents": "Mr. S. Kumar & Mrs. Meena Kumar",
      "brideParentsMl": "ശ്രീ. എസ്. കുമാർ – ശ്രീമതി മീന",
      "order": "groom_first",
      "sizeCouple": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "blessingMl1": "ഈശ്വരാനുഗ്രഹത്താലും",
      "blessingMl2": "ഗുരുജനങ്ങളുടെ ആശീർവാദത്തോടെയും",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "requestMl": "ദമ്പതികളുടെ മകൻ",
      "sizeInvitation": "100",
      "weddingDate": "2026-09-28",
      "muhurthamFrom": "10:30",
      "muhurthamTo": "11:15",
      "venueEn": "Kayal Kalyana Mandapam",
      "venueLineEn": "Punnamada, Alappuzha",
      "venueMl": "കായൽ കല്യാണ മണ്ഡപം, പുന്നമട, ആലപ്പുഴ",
      "sizeWedding": "100",
      "receptionDate": "2026-09-27",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueMl": "",
      "sizeReception": "100",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "thanksMl": "നന്ദി",
      "thanksLineMl": "നിങ്ങളുടെ സാന്നിധ്യം ഹൃദയപൂർവ്വം പ്രതീക്ഷിക്കുന്നു",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "degNames": "couple",
      "degIntro": "couple",
      "degInvite": "couple",
      "degThanks": "couple",
      "lang": "title",
      "titleScript": "title",
      "titleCaps": "title",
      "titleScriptMl": "title",
      "titleCapsMl": "title",
      "groomEn": "couple",
      "groomMl": "couple",
      "brideEn": "couple",
      "brideMl": "couple",
      "order": "couple",
      "groomDegree": "couple",
      "brideDegree": "couple",
      "groomParents": "couple",
      "groomParentsMl": "couple",
      "brideParents": "couple",
      "brideParentsMl": "couple",
      "blessing1": "invitation",
      "blessing2": "invitation",
      "blessingMl1": "invitation",
      "blessingMl2": "invitation",
      "request1": "invitation",
      "request2": "invitation",
      "requestMl": "invitation",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "venueMl": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "receptionVenueMl": "reception",
      "thanks": "thanks",
      "thanksLine": "thanks",
      "thanksMl": "thanks",
      "thanksLineMl": "thanks",
      "sizeTitle": "title",
      "sizeCouple": "couple",
      "sizeInvitation": "invitation",
      "sizeWedding": "wedding",
      "sizeReception": "reception",
      "sizeThanks": "thanks"
    },
    "photoSlots": [],
    "duration": 50.8,
    "kind": "webgl"
  },
  {
    "id": "film-veedu-v1",
    "design": "veedu",
    "name": "Engal Veetu Kalyanam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "veedu-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "opening",
          "title": "Opening",
          "scene": "opening",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "sizeOpening",
              "label": "Size Opening",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Veedu Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "family",
              "label": "Family name (optional)",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "ganesha",
              "label": "Ganesha",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "yes",
                "no"
              ],
              "optionLabels": {
                "yes": "Show",
                "no": "Hide"
              }
            },
            {
              "path": "blessing1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessing2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 50
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 50
            },
            {
              "path": "request1",
              "label": "Invitation line",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            }
          ]
        },
        {
          "id": "events",
          "title": "Events",
          "scene": "events",
          "questions": [
            {
              "path": "mehendiDate",
              "label": "Mehendi date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "mehendiFrom",
              "label": "Mehendi From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "mehendiTo",
              "label": "Mehendi To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "mehendiVenue",
              "label": "Mehendi venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "haldiDate",
              "label": "Haldi date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "haldiFrom",
              "label": "Haldi From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "haldiTo",
              "label": "Haldi To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "haldiVenue",
              "label": "Haldi venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "sangeetDate",
              "label": "Sangeet date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "sangeetFrom",
              "label": "Sangeet From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "sangeetTo",
              "label": "Sangeet To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "sangeetVenue",
              "label": "Sangeet venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "dog",
              "label": "Dog",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "yes",
                "no"
              ],
              "optionLabels": {
                "yes": "Show",
                "no": "Hide"
              }
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "doodles",
              "label": "Doodles",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "yes",
                "no"
              ],
              "optionLabels": {
                "yes": "Show",
                "no": "Hide"
              }
            },
            {
              "path": "sizeEvents",
              "label": "Size Events",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            },
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "venueLineEn",
              "label": "Area & town",
              "type": "text",
              "required": true,
              "maxLength": 40
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 64
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "sizeThanks",
              "label": "Size Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "groomEn": "",
      "brideEn": "",
      "order": "groom_first",
      "family": "",
      "ganesha": "yes",
      "sizeOpening": "100",
      "blessing1": "With the blessings of Lord Murugan",
      "blessing2": "and our beloved elders,",
      "groomParents": "",
      "brideParents": "",
      "request1": "joyfully invite you to the wedding of their son",
      "mehendiDate": "",
      "mehendiFrom": "",
      "mehendiTo": "",
      "mehendiVenue": "",
      "haldiDate": "",
      "haldiFrom": "",
      "haldiTo": "",
      "haldiVenue": "",
      "sangeetDate": "",
      "sangeetFrom": "",
      "sangeetTo": "",
      "sangeetVenue": "",
      "dog": "yes",
      "doodles": "yes",
      "sizeEvents": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "thanks": "With love",
      "thanksLine": "We can't wait to celebrate with you",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "groomEn": "Arjun",
      "brideEn": "Priya",
      "order": "groom_first",
      "family": "Ramanathan",
      "ganesha": "yes",
      "sizeOpening": "100",
      "blessing1": "With the blessings of Lord Murugan",
      "blessing2": "and our beloved elders,",
      "groomParents": "Mr. R. Ramanathan & Mrs. Lakshmi Ramanathan",
      "brideParents": "Mr. S. Sundaram & Mrs. Meena Sundaram",
      "request1": "joyfully invite you to the wedding of their son",
      "mehendiDate": "2027-02-12",
      "mehendiFrom": "16:00",
      "mehendiTo": "",
      "mehendiVenue": "Our home, Karaikudi",
      "haldiDate": "2027-02-13",
      "haldiFrom": "09:00",
      "haldiTo": "",
      "haldiVenue": "Our home, Karaikudi",
      "sangeetDate": "2027-02-13",
      "sangeetFrom": "19:00",
      "sangeetTo": "",
      "sangeetVenue": "Sri Meenakshi Mahal, Karaikudi",
      "dog": "yes",
      "doodles": "yes",
      "sizeEvents": "100",
      "weddingDate": "2027-02-14",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Sri Meenakshi Mahal",
      "venueLineEn": "Karaikudi",
      "receptionDate": "2027-02-14",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "",
      "thanks": "With love",
      "thanksLine": "We can't wait to celebrate with you",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "invitation",
      "groomEn": "opening",
      "brideEn": "opening",
      "order": "invitation",
      "family": "invitation",
      "ganesha": "invitation",
      "sizeOpening": "opening",
      "blessing1": "invitation",
      "blessing2": "invitation",
      "groomParents": "invitation",
      "brideParents": "invitation",
      "request1": "invitation",
      "mehendiDate": "events",
      "mehendiFrom": "events",
      "mehendiTo": "events",
      "mehendiVenue": "events",
      "haldiDate": "events",
      "haldiFrom": "events",
      "haldiTo": "events",
      "haldiVenue": "events",
      "sangeetDate": "events",
      "sangeetFrom": "events",
      "sangeetTo": "events",
      "sangeetVenue": "events",
      "dog": "events",
      "doodles": "wedding",
      "sizeEvents": "wedding",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "thanks": "thanks",
      "thanksLine": "thanks",
      "sizeThanks": "thanks"
    },
    "photoSlots": [],
    "duration": 133,
    "kind": "webgl"
  },
  {
    "id": "film-walk-v1",
    "design": "walk",
    "name": "Wisteria Walk",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "walk-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "gate",
          "title": "Gate",
          "scene": "gate",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Wisteria Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            }
          ]
        },
        {
          "id": "welcome",
          "title": "Welcome",
          "scene": "welcome",
          "questions": [
            {
              "path": "blessing",
              "label": "Blessing",
              "type": "textarea",
              "required": false,
              "maxLength": 80
            }
          ]
        },
        {
          "id": "story",
          "title": "Our story",
          "scene": "story",
          "questions": [
            {
              "path": "story",
              "label": "Your story (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 220
            }
          ]
        },
        {
          "id": "engagement",
          "title": "Engagement",
          "scene": "engagement",
          "questions": [
            {
              "path": "engagementDate",
              "label": "Engagement date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "engagementFrom",
              "label": "Engagement From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "engagementTo",
              "label": "Engagement To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "engagementVenue",
              "label": "Venue",
              "type": "text",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "engagementPlace",
              "label": "Town or area",
              "type": "text",
              "required": false,
              "maxLength": 40
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "weddingFrom",
              "label": "Wedding From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "weddingTo",
              "label": "Wedding To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "weddingVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 44
            },
            {
              "path": "weddingPlace",
              "label": "Town or area",
              "type": "text",
              "required": true,
              "maxLength": 40
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Venue",
              "type": "text",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "receptionPlace",
              "label": "Town or area",
              "type": "text",
              "required": false,
              "maxLength": 40
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": []
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "groomEn": "",
      "brideEn": "",
      "order": "groom_first",
      "blessing": "With the blessings of our families",
      "story": "",
      "engagementDate": "",
      "engagementFrom": "",
      "engagementTo": "",
      "engagementVenue": "",
      "engagementPlace": "",
      "weddingDate": "",
      "weddingFrom": "",
      "weddingTo": "",
      "weddingVenue": "",
      "weddingPlace": "",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionPlace": "",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "groomEn": "Vikram",
      "brideEn": "Nila",
      "order": "groom_first",
      "blessing": "With the blessings of our families",
      "story": "Two friends, one rainy afternoon,\ncountless cups of coffee since,\nand now, forever.",
      "engagementDate": "2027-01-30",
      "engagementFrom": "18:00",
      "engagementTo": "20:30",
      "engagementVenue": "At home",
      "engagementPlace": "Chennai",
      "weddingDate": "2027-02-14",
      "weddingFrom": "10:00",
      "weddingTo": "11:30",
      "weddingVenue": "The Garden Lawns",
      "weddingPlace": "Chennai",
      "receptionDate": "2027-02-14",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "The Garden Lawns",
      "receptionPlace": "Chennai",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "gate",
      "groomEn": "gate",
      "brideEn": "gate",
      "order": "gate",
      "blessing": "welcome",
      "story": "story",
      "engagementDate": "engagement",
      "engagementFrom": "engagement",
      "engagementTo": "engagement",
      "engagementVenue": "engagement",
      "engagementPlace": "engagement",
      "weddingDate": "wedding",
      "weddingFrom": "wedding",
      "weddingTo": "wedding",
      "weddingVenue": "wedding",
      "weddingPlace": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "receptionPlace": "reception"
    },
    "photoSlots": [],
    "duration": 59.5,
    "kind": "page"
  },
  {
    "id": "film-kurinji-v1",
    "design": "kurinji",
    "name": "Kurinji",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "kurinji-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Kurinji Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "titleScript",
              "label": "Title (script)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "titleCaps",
              "label": "Under the title",
              "type": "text",
              "required": false,
              "maxLength": 22
            }
          ]
        },
        {
          "id": "couple",
          "title": "Couple",
          "scene": "couple",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "blessing1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessing2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 56
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 56
            },
            {
              "path": "request1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "request2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name (the hall)",
              "type": "text",
              "required": true,
              "maxLength": 44
            },
            {
              "path": "venueLineEn",
              "label": "Area & town",
              "type": "text",
              "required": true,
              "maxLength": 40
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 80
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you title (script)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "groomEn": "",
      "brideEn": "",
      "order": "groom_first",
      "blessing1": "With the blessings of Lord Murugan",
      "blessing2": "and our beloved elders,",
      "groomParents": "",
      "brideParents": "",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "titleScript": "Wedding",
      "titleCaps": "INVITATION",
      "groomEn": "Arjun",
      "brideEn": "Priya",
      "order": "groom_first",
      "blessing1": "With the blessings of Lord Murugan",
      "blessing2": "and our beloved elders,",
      "groomParents": "Mr. R. Raman & Mrs. Lakshmi Raman",
      "brideParents": "Mr. S. Kumar & Mrs. Meena Kumar",
      "request1": "request the pleasure of your company",
      "request2": "at the wedding of their son",
      "weddingDate": "2026-09-28",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Sri Murugan Thirumana Mandapam",
      "venueLineEn": "Thiruttani",
      "receptionDate": "2026-09-27",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "",
      "thanks": "Thank you",
      "thanksLine": "We can't wait to celebrate with you",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "titleScript": "title",
      "titleCaps": "title",
      "groomEn": "couple",
      "brideEn": "couple",
      "order": "couple",
      "blessing1": "invitation",
      "blessing2": "invitation",
      "groomParents": "invitation",
      "brideParents": "invitation",
      "request1": "invitation",
      "request2": "invitation",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "thanks": "thanks",
      "thanksLine": "thanks"
    },
    "photoSlots": [],
    "duration": 67.75,
    "kind": "plate"
  },
  {
    "id": "film-valli-v1",
    "design": "valli",
    "name": "Valli Thirumanam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "valli-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "opening",
          "title": "Opening",
          "scene": "opening",
          "questions": [
            {
              "path": "lang",
              "label": "Lang",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "en",
                "ta"
              ],
              "optionLabels": {
                "en": "English",
                "ta": "Tamil"
              }
            },
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Valli Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomTa",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideTa",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "sizeOpening",
              "label": "Size Opening",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "blessing1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessing2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessingTa1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "blessingTa2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 50
            },
            {
              "path": "groomParentsTa",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 50
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 50
            },
            {
              "path": "brideParentsTa",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 50
            },
            {
              "path": "request1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "requestTa",
              "label": "Line",
              "type": "textarea",
              "required": false,
              "maxLength": 40
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name (the hall)",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "venueLineEn",
              "label": "Area & town",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "venueTa",
              "label": "Venue (the hall's name, then a comma, then the area and town)",
              "type": "textarea",
              "required": true,
              "maxLength": 64
            },
            {
              "path": "sizeEvents",
              "label": "Size Events",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 64
            },
            {
              "path": "receptionVenueTa",
              "label": "Reception venue (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 64
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you title (script)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "thanksTa",
              "label": "Thank-you title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLineTa",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "sizeThanks",
              "label": "Size Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "lang": "en",
      "fontSet": "classic",
      "groomEn": "",
      "groomTa": "",
      "brideEn": "",
      "brideTa": "",
      "order": "groom_first",
      "sizeOpening": "100",
      "blessing1": "With the blessings of Lord Murugan",
      "blessing2": "and our beloved elders,",
      "blessingTa1": "முருகப் பெருமான் அருளாலும்",
      "blessingTa2": "பெரியோர்களின் ஆசியுடனும்",
      "groomParents": "",
      "groomParentsTa": "",
      "brideParents": "",
      "brideParentsTa": "",
      "request1": "joyfully invite you to the wedding of their son",
      "requestTa": "இவர்களின் அன்பு மகன்",
      "sizeInvitation": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "venueTa": "",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueTa": "",
      "sizeEvents": "100",
      "thanks": "With love",
      "thanksLine": "Your presence is our blessing",
      "thanksTa": "அன்புடன்",
      "thanksLineTa": "உங்கள் வருகையை அன்புடன் எதிர்பார்க்கிறோம்",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "lang": "en",
      "fontSet": "classic",
      "groomEn": "Arjun",
      "groomTa": "அர்ஜுன்",
      "brideEn": "Priya",
      "brideTa": "பிரியா",
      "order": "groom_first",
      "sizeOpening": "100",
      "blessing1": "With the blessings of Lord Murugan",
      "blessing2": "and our beloved elders,",
      "blessingTa1": "முருகப் பெருமான் அருளாலும்",
      "blessingTa2": "பெரியோர்களின் ஆசியுடனும்",
      "groomParents": "Mr. R. Ramanathan & Mrs. Lakshmi Ramanathan",
      "groomParentsTa": "திரு. ரா. ராமநாதன் – திருமதி. லட்சுமி",
      "brideParents": "Mr. S. Sundaram & Mrs. Meena Sundaram",
      "brideParentsTa": "திரு. சு. சுந்தரம்",
      "request1": "joyfully invite you to the wedding of their son",
      "requestTa": "இவர்களின் அன்பு மகன்",
      "sizeInvitation": "100",
      "weddingDate": "2027-02-14",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Sri Murugan Kalyana Mandapam",
      "venueLineEn": "Thiruthani",
      "venueTa": "ஸ்ரீ முருகன் கல்யாண மண்டபம், திருத்தணி",
      "receptionDate": "2027-02-14",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueTa": "",
      "sizeEvents": "100",
      "thanks": "With love",
      "thanksLine": "Your presence is our blessing",
      "thanksTa": "அன்புடன்",
      "thanksLineTa": "உங்கள் வருகையை அன்புடன் எதிர்பார்க்கிறோம்",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "lang": "opening",
      "fontSet": "opening",
      "groomEn": "opening",
      "groomTa": "opening",
      "brideEn": "opening",
      "brideTa": "opening",
      "order": "invitation",
      "sizeOpening": "opening",
      "blessing1": "invitation",
      "blessing2": "invitation",
      "blessingTa1": "invitation",
      "blessingTa2": "invitation",
      "groomParents": "invitation",
      "groomParentsTa": "invitation",
      "brideParents": "invitation",
      "brideParentsTa": "invitation",
      "request1": "invitation",
      "requestTa": "invitation",
      "sizeInvitation": "invitation",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "venueTa": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "receptionVenueTa": "reception",
      "sizeEvents": "wedding",
      "thanks": "thanks",
      "thanksLine": "thanks",
      "thanksTa": "thanks",
      "thanksLineTa": "thanks",
      "sizeThanks": "thanks"
    },
    "photoSlots": [],
    "duration": 61.4,
    "kind": "webgl"
  },
  {
    "id": "film-aranmanai-v1",
    "design": "aranmanai",
    "name": "Aranmanai Kalyanam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "aranmanai-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "opening",
          "title": "Opening",
          "scene": "opening",
          "questions": [
            {
              "path": "lang",
              "label": "Lang",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "en",
                "ta"
              ],
              "optionLabels": {
                "en": "English",
                "ta": "Tamil"
              }
            },
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Palace Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "groomTa",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "brideTa",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 24
            },
            {
              "path": "sizeOpening",
              "label": "Size Opening",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "blessing1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessing2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessingTa1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "blessingTa2",
              "label": "Line 2",
              "type": "textarea",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 50
            },
            {
              "path": "groomParentsTa",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 50
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 50
            },
            {
              "path": "brideParentsTa",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 50
            },
            {
              "path": "request1",
              "label": "Line 1",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "requestTa",
              "label": "Line",
              "type": "textarea",
              "required": false,
              "maxLength": 40
            },
            {
              "path": "ganesha",
              "label": "Ganesha",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "yes",
                "no"
              ],
              "optionLabels": {
                "yes": "Show",
                "no": "Hide"
              }
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "events",
          "title": "Events",
          "scene": "events",
          "questions": [
            {
              "path": "haldiDate",
              "label": "Haldi date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "haldiFrom",
              "label": "Haldi From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "haldiTo",
              "label": "Haldi To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "haldiVenue",
              "label": "Haldi venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "haldiVenueTa",
              "label": "Haldi venue (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "mehendiDate",
              "label": "Mehendi date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "mehendiFrom",
              "label": "Mehendi From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "mehendiTo",
              "label": "Mehendi To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "mehendiVenue",
              "label": "Mehendi venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "mehendiVenueTa",
              "label": "Mehendi venue (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "mayraDate",
              "label": "Mayra date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "mayraFrom",
              "label": "Mayra From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "mayraTo",
              "label": "Mayra To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "mayraVenue",
              "label": "Mayra venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "mayraVenueTa",
              "label": "Mayra venue (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "sangeetDate",
              "label": "Sangeet date",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "sangeetFrom",
              "label": "Sangeet From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "sangeetTo",
              "label": "Sangeet To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "sangeetVenue",
              "label": "Sangeet venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "sangeetVenueTa",
              "label": "Sangeet venue (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name (the hall)",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "venueLineEn",
              "label": "Area & town",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "venueTa",
              "label": "Venue (the hall's name, then a comma, then the area and town)",
              "type": "textarea",
              "required": true,
              "maxLength": 64
            },
            {
              "path": "sizeEvents",
              "label": "Size Events",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 64
            },
            {
              "path": "receptionVenueTa",
              "label": "Reception venue (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 64
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you title (script)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "thanksTa",
              "label": "Thank-you title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLineTa",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "sizeThanks",
              "label": "Size Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "lang": "en",
      "fontSet": "classic",
      "groomEn": "",
      "groomTa": "",
      "brideEn": "",
      "brideTa": "",
      "order": "groom_first",
      "sizeOpening": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "blessingTa1": "இறைவன் அருளாலும்",
      "blessingTa2": "பெரியோர்களின் ஆசியுடனும்",
      "groomParents": "",
      "groomParentsTa": "",
      "brideParents": "",
      "brideParentsTa": "",
      "request1": "joyfully invite you to the wedding of their son",
      "requestTa": "இவர்களின் அன்பு மகன்",
      "ganesha": "yes",
      "sizeInvitation": "100",
      "haldiDate": "",
      "haldiFrom": "",
      "haldiTo": "",
      "haldiVenue": "",
      "haldiVenueTa": "",
      "mehendiDate": "",
      "mehendiFrom": "",
      "mehendiTo": "",
      "mehendiVenue": "",
      "mehendiVenueTa": "",
      "mayraDate": "",
      "mayraFrom": "",
      "mayraTo": "",
      "mayraVenue": "",
      "mayraVenueTa": "",
      "sangeetDate": "",
      "sangeetFrom": "",
      "sangeetTo": "",
      "sangeetVenue": "",
      "sangeetVenueTa": "",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "venueTa": "",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueTa": "",
      "sizeEvents": "100",
      "thanks": "With love",
      "thanksLine": "Your presence is our blessing",
      "thanksTa": "அன்புடன்",
      "thanksLineTa": "உங்கள் வருகையை அன்புடன் எதிர்பார்க்கிறோம்",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "lang": "en",
      "fontSet": "classic",
      "groomEn": "Arjun",
      "groomTa": "அர்ஜுன்",
      "brideEn": "Priya",
      "brideTa": "பிரியா",
      "order": "groom_first",
      "sizeOpening": "100",
      "blessing1": "With the blessings of the Almighty",
      "blessing2": "and our beloved elders,",
      "blessingTa1": "இறைவன் அருளாலும்",
      "blessingTa2": "பெரியோர்களின் ஆசியுடனும்",
      "groomParents": "Mr. R. Ramanathan & Mrs. Lakshmi Ramanathan",
      "groomParentsTa": "திரு. ரா. ராமநாதன் – திருமதி. லட்சுமி",
      "brideParents": "Mr. S. Sundaram & Mrs. Meena Sundaram",
      "brideParentsTa": "திரு. சு. சுந்தரம்",
      "request1": "joyfully invite you to the wedding of their son",
      "requestTa": "இவர்களின் அன்பு மகன்",
      "ganesha": "yes",
      "sizeInvitation": "100",
      "haldiDate": "2027-02-12",
      "haldiFrom": "10:00",
      "haldiTo": "",
      "haldiVenue": "The Palace Lawns, Mysuru",
      "haldiVenueTa": "அரண்மனை புல்வெளி, மைசூரு",
      "mehendiDate": "2027-02-12",
      "mehendiFrom": "16:00",
      "mehendiTo": "",
      "mehendiVenue": "The Palace Lawns, Mysuru",
      "mehendiVenueTa": "அரண்மனை புல்வெளி, மைசூரு",
      "mayraDate": "2027-02-13",
      "mayraFrom": "11:00",
      "mayraTo": "",
      "mayraVenue": "The Palace Courtyard, Mysuru",
      "mayraVenueTa": "அரண்மனை முற்றம், மைசூரு",
      "sangeetDate": "2027-02-13",
      "sangeetFrom": "20:00",
      "sangeetTo": "",
      "sangeetVenue": "The Palace Courtyard, Mysuru",
      "sangeetVenueTa": "அரண்மனை முற்றம், மைசூரு",
      "weddingDate": "2027-02-14",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Sri Lakshmi Kalyana Mantapa",
      "venueLineEn": "Mysuru",
      "venueTa": "ஸ்ரீ லட்சுமி கல்யாண மண்டபம், மைசூரு",
      "receptionDate": "2027-02-14",
      "receptionFrom": "19:00",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueTa": "",
      "sizeEvents": "100",
      "thanks": "With love",
      "thanksLine": "Your presence is our blessing",
      "thanksTa": "அன்புடன்",
      "thanksLineTa": "உங்கள் வருகையை அன்புடன் எதிர்பார்க்கிறோம்",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "lang": "opening",
      "fontSet": "opening",
      "groomEn": "opening",
      "groomTa": "opening",
      "brideEn": "opening",
      "brideTa": "opening",
      "order": "invitation",
      "sizeOpening": "opening",
      "blessing1": "invitation",
      "blessing2": "invitation",
      "blessingTa1": "invitation",
      "blessingTa2": "invitation",
      "groomParents": "invitation",
      "groomParentsTa": "invitation",
      "brideParents": "invitation",
      "brideParentsTa": "invitation",
      "request1": "invitation",
      "requestTa": "invitation",
      "ganesha": "invitation",
      "sizeInvitation": "invitation",
      "haldiDate": "events",
      "haldiFrom": "events",
      "haldiTo": "events",
      "haldiVenue": "events",
      "haldiVenueTa": "events",
      "mehendiDate": "events",
      "mehendiFrom": "events",
      "mehendiTo": "events",
      "mehendiVenue": "events",
      "mehendiVenueTa": "events",
      "mayraDate": "events",
      "mayraFrom": "events",
      "mayraTo": "events",
      "mayraVenue": "events",
      "mayraVenueTa": "events",
      "sangeetDate": "events",
      "sangeetFrom": "events",
      "sangeetTo": "events",
      "sangeetVenue": "events",
      "sangeetVenueTa": "events",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "venueTa": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "receptionVenueTa": "reception",
      "sizeEvents": "wedding",
      "thanks": "thanks",
      "thanksLine": "thanks",
      "thanksTa": "thanks",
      "thanksLineTa": "thanks",
      "sizeThanks": "thanks"
    },
    "photoSlots": [],
    "duration": 118,
    "kind": "webgl"
  },
  {
    "id": "film-gettimelam-v1",
    "design": "gettimelam",
    "name": "Getti Melam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "gettimelam-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "opening",
          "title": "Opening",
          "scene": "opening",
          "questions": [
            {
              "path": "lang",
              "label": "Lang",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "en",
                "ta"
              ],
              "optionLabels": {
                "en": "English",
                "ta": "Tamil"
              }
            },
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Getti Melam Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "titleTop",
              "label": "Small line above",
              "type": "text",
              "required": false,
              "maxLength": 32
            },
            {
              "path": "title",
              "label": "Title (script)",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "titleTopTa",
              "label": "Small line above",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "titleTa",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 20
            },
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "groomTa",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 16
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "brideTa",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 16
            },
            {
              "path": "ganesha",
              "label": "Ganesha",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "yes",
                "no"
              ],
              "optionLabels": {
                "yes": "Show",
                "no": "Hide"
              }
            },
            {
              "path": "sizeOpening",
              "label": "Size Opening",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "blessing1",
              "label": "Blessing (small capitals)",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessingTa1",
              "label": "Blessing",
              "type": "textarea",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 56
            },
            {
              "path": "groomParentsTa",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 56
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 56
            },
            {
              "path": "brideParentsTa",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 56
            },
            {
              "path": "request1",
              "label": "Line under the parents",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "requestTa",
              "label": "Line under the parents",
              "type": "textarea",
              "required": false,
              "maxLength": 40
            },
            {
              "path": "inviteTa",
              "label": "Last line",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name (the hall)",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "venueLineEn",
              "label": "Address (street, area, town)",
              "type": "text",
              "required": true,
              "maxLength": 48
            },
            {
              "path": "venueTa",
              "label": "Venue (the hall's name, then a comma, then the address)",
              "type": "textarea",
              "required": true,
              "maxLength": 80
            },
            {
              "path": "sizeEvents",
              "label": "Size Events",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 80
            },
            {
              "path": "receptionVenueTa",
              "label": "Reception venue (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 80
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you title (script)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "thanksTa",
              "label": "Thank-you title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLineTa",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "sizeThanks",
              "label": "Size Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "lang": "en",
      "fontSet": "classic",
      "titleTop": "With joy in our hearts",
      "title": "Wedding Invitation",
      "titleTopTa": "மனமகிழ்ச்சியுடன்",
      "titleTa": "திருமண அழைப்பிதழ்",
      "groomEn": "",
      "groomTa": "",
      "brideEn": "",
      "brideTa": "",
      "order": "groom_first",
      "ganesha": "yes",
      "sizeOpening": "100",
      "blessing1": "With the blessings of our elders",
      "blessingTa1": "பெரியோர்களின் நல்லாசியுடன்",
      "groomParents": "",
      "groomParentsTa": "",
      "brideParents": "",
      "brideParentsTa": "",
      "request1": "invite you to the wedding of their son",
      "requestTa": "இவர்களின் மகன்",
      "inviteTa": "திருமணத்திற்குத் தங்களை அன்புடன் அழைக்கிறோம்",
      "sizeInvitation": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "venueTa": "",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueTa": "",
      "sizeEvents": "100",
      "thanks": "With love",
      "thanksLine": "Your presence is our blessing",
      "thanksTa": "அன்புடன்",
      "thanksLineTa": "உங்கள் வருகையே எங்கள் ஆசீர்வாதம்",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "lang": "en",
      "fontSet": "classic",
      "titleTop": "With joy in our hearts",
      "title": "Wedding Invitation",
      "titleTopTa": "மனமகிழ்ச்சியுடன்",
      "titleTa": "திருமண அழைப்பிதழ்",
      "groomEn": "Vignesh",
      "groomTa": "விக்னேஷ்",
      "brideEn": "Priyadharshini",
      "brideTa": "பிரியதர்ஷினி",
      "order": "groom_first",
      "ganesha": "yes",
      "sizeOpening": "100",
      "blessing1": "With the blessings of our elders",
      "blessingTa1": "பெரியோர்களின் நல்லாசியுடன்",
      "groomParents": "Mr. R. Senthil Kumar & Mrs. S. Malathi",
      "groomParentsTa": "திரு. ரா. செந்தில் குமார் - திருமதி. செ. மாலதி",
      "brideParents": "Mr. K. Raghavan & Mrs. R. Sudha",
      "brideParentsTa": "திரு. க. ராகவன் - திருமதி. ரா. சுதா",
      "request1": "invite you to the wedding of their son",
      "requestTa": "இவர்களின் மகன்",
      "inviteTa": "திருமணத்திற்குத் தங்களை அன்புடன் அழைக்கிறோம்",
      "sizeInvitation": "100",
      "weddingDate": "2027-02-12",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Sri Balaji Kalyana Mandapam",
      "venueLineEn": "12 Second Avenue, Anna Nagar, Chennai",
      "venueTa": "ஸ்ரீ பாலாஜி கல்யாண மண்டபம், 12 இரண்டாவது அவென்யூ, அண்ணா நகர், சென்னை",
      "receptionDate": "2027-02-12",
      "receptionFrom": "18:30",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueTa": "",
      "sizeEvents": "100",
      "thanks": "With love",
      "thanksLine": "Your presence is our blessing",
      "thanksTa": "அன்புடன்",
      "thanksLineTa": "உங்கள் வருகையே எங்கள் ஆசீர்வாதம்",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "lang": "opening",
      "fontSet": "opening",
      "titleTop": "opening",
      "title": "opening",
      "titleTopTa": "opening",
      "titleTa": "opening",
      "groomEn": "opening",
      "groomTa": "opening",
      "brideEn": "opening",
      "brideTa": "opening",
      "order": "invitation",
      "ganesha": "opening",
      "sizeOpening": "opening",
      "blessing1": "invitation",
      "blessingTa1": "invitation",
      "groomParents": "invitation",
      "groomParentsTa": "invitation",
      "brideParents": "invitation",
      "brideParentsTa": "invitation",
      "request1": "invitation",
      "requestTa": "invitation",
      "inviteTa": "invitation",
      "sizeInvitation": "invitation",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "venueTa": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "receptionVenueTa": "reception",
      "sizeEvents": "wedding",
      "thanks": "thanks",
      "thanksLine": "thanks",
      "thanksTa": "thanks",
      "thanksLineTa": "thanks",
      "sizeThanks": "thanks"
    },
    "photoSlots": [],
    "duration": 55,
    "kind": "webgl"
  },
  {
    "id": "film-kondattam-v1",
    "design": "kondattam",
    "name": "Kondattam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "kondattam-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "opening",
          "title": "Title",
          "scene": "opening",
          "questions": [
            {
              "path": "titleTop",
              "label": "Small line above",
              "type": "text",
              "required": false,
              "maxLength": 30
            },
            {
              "path": "title",
              "label": "Title (script)",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "titleTopTa",
              "label": "Small line above",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "titleTa",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 20
            }
          ]
        },
        {
          "id": "names",
          "title": "Names",
          "scene": "names",
          "questions": [
            {
              "path": "lang",
              "label": "Lang",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "en",
                "ta"
              ],
              "optionLabels": {
                "en": "English",
                "ta": "Tamil"
              }
            },
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Kondattam Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "groomTa",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "brideTa",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "sizeOpening",
              "label": "Size Opening",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "blessing1",
              "label": "Blessing (small capitals)",
              "type": "textarea",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "blessingTa1",
              "label": "Blessing",
              "type": "textarea",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 52
            },
            {
              "path": "groomParentsTa",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 48
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 52
            },
            {
              "path": "brideParentsTa",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 48
            },
            {
              "path": "request1",
              "label": "Line under the parents",
              "type": "textarea",
              "required": false,
              "maxLength": 52
            },
            {
              "path": "requestTa",
              "label": "Line under the parents",
              "type": "textarea",
              "required": false,
              "maxLength": 40
            },
            {
              "path": "inviteTa",
              "label": "Last line",
              "type": "textarea",
              "required": false,
              "maxLength": 52
            },
            {
              "path": "ganesha",
              "label": "Ganesha",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "yes",
                "no"
              ],
              "optionLabels": {
                "yes": "Show",
                "no": "Hide"
              }
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name (the hall)",
              "type": "text",
              "required": true,
              "maxLength": 48
            },
            {
              "path": "venueLineEn",
              "label": "Address (street, area, town)",
              "type": "text",
              "required": true,
              "maxLength": 56
            },
            {
              "path": "venueTa",
              "label": "Venue (the hall's name, then a comma, then the address)",
              "type": "textarea",
              "required": true,
              "maxLength": 85
            },
            {
              "path": "sizeEvents",
              "label": "Size Events",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 85
            },
            {
              "path": "receptionVenueTa",
              "label": "Reception venue (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 85
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks",
              "label": "Thank-you title (script)",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLine",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 40
            },
            {
              "path": "thanksTa",
              "label": "Thank-you title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "thanksLineTa",
              "label": "Line under it",
              "type": "textarea",
              "required": false,
              "maxLength": 40
            },
            {
              "path": "sizeThanks",
              "label": "Size Thanks",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "lang": "en",
      "fontSet": "classic",
      "titleTop": "With joy in our hearts",
      "title": "Wedding Invitation",
      "titleTopTa": "மனமகிழ்ச்சியுடன்",
      "titleTa": "திருமண அழைப்பிதழ்",
      "groomEn": "",
      "groomTa": "",
      "brideEn": "",
      "brideTa": "",
      "order": "groom_first",
      "sizeOpening": "100",
      "blessing1": "With the blessings of our elders",
      "blessingTa1": "பெரியோர்களின் நல்லாசியுடன்",
      "groomParents": "",
      "groomParentsTa": "",
      "brideParents": "",
      "brideParentsTa": "",
      "request1": "invite you to the wedding of their son",
      "requestTa": "இவர்களின் மகன்",
      "inviteTa": "திருமணத்திற்குத் தங்களை அன்புடன் அழைக்கிறோம்",
      "ganesha": "yes",
      "sizeInvitation": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "venueTa": "",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueTa": "",
      "sizeEvents": "100",
      "thanks": "With love",
      "thanksLine": "Your presence is our blessing",
      "thanksTa": "அன்புடன்",
      "thanksLineTa": "உங்கள் வருகையே எங்கள் ஆசீர்வாதம்",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "lang": "en",
      "fontSet": "classic",
      "titleTop": "With joy in our hearts",
      "title": "Wedding Invitation",
      "titleTopTa": "மனமகிழ்ச்சியுடன்",
      "titleTa": "திருமண அழைப்பிதழ்",
      "groomEn": "Vignesh",
      "groomTa": "விக்னேஷ்",
      "brideEn": "Priyadharshini",
      "brideTa": "பிரியதர்ஷினி",
      "order": "groom_first",
      "sizeOpening": "100",
      "blessing1": "With the blessings of our elders",
      "blessingTa1": "பெரியோர்களின் நல்லாசியுடன்",
      "groomParents": "Mr. R. Senthil Kumar & Mrs. S. Malathi",
      "groomParentsTa": "திரு. ரா. செந்தில் குமார் - திருமதி. செ. மாலதி",
      "brideParents": "Mr. K. Raghavan & Mrs. R. Sudha",
      "brideParentsTa": "திரு. க. ராகவன் - திருமதி. ரா. சுதா",
      "request1": "invite you to the wedding of their son",
      "requestTa": "இவர்களின் மகன்",
      "inviteTa": "திருமணத்திற்குத் தங்களை அன்புடன் அழைக்கிறோம்",
      "ganesha": "yes",
      "sizeInvitation": "100",
      "weddingDate": "2027-02-12",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Sri Balaji Kalyana Mandapam",
      "venueLineEn": "12 Second Avenue, Anna Nagar, Chennai",
      "venueTa": "ஸ்ரீ பாலாஜி கல்யாண மண்டபம், 12 இரண்டாவது அவென்யூ, அண்ணா நகர், சென்னை",
      "receptionDate": "2027-02-11",
      "receptionFrom": "18:30",
      "receptionTo": "",
      "receptionVenue": "Hotel Green Park, 183 NSK Salai, Vadapalani, Chennai",
      "receptionVenueTa": "ஹோட்டல் கிரீன் பார்க், 183 என்.எஸ்.கே. சாலை, வடபழனி, சென்னை",
      "sizeEvents": "100",
      "thanks": "With love",
      "thanksLine": "Your presence is our blessing",
      "thanksTa": "அன்புடன்",
      "thanksLineTa": "உங்கள் வருகையே எங்கள் ஆசீர்வாதம்",
      "sizeThanks": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "lang": "names",
      "fontSet": "names",
      "titleTop": "opening",
      "title": "opening",
      "titleTopTa": "opening",
      "titleTa": "opening",
      "groomEn": "names",
      "groomTa": "names",
      "brideEn": "names",
      "brideTa": "names",
      "order": "invitation",
      "ganesha": "invitation",
      "sizeOpening": "names",
      "blessing1": "invitation",
      "blessingTa1": "invitation",
      "groomParents": "invitation",
      "groomParentsTa": "invitation",
      "brideParents": "invitation",
      "brideParentsTa": "invitation",
      "request1": "invitation",
      "requestTa": "invitation",
      "inviteTa": "invitation",
      "sizeInvitation": "invitation",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "venueTa": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "receptionVenueTa": "reception",
      "sizeEvents": "wedding",
      "thanks": "thanks",
      "thanksLine": "thanks",
      "thanksTa": "thanks",
      "thanksLineTa": "thanks",
      "sizeThanks": "thanks",
      "photoId": "thanks",
      "photoBox": "thanks"
    },
    "photoSlots": [
      {
        "slot": "couple",
        "label": "Couple photo",
        "field": "photoId",
        "box": "photoBox",
        "scene": "thanks"
      }
    ],
    "duration": 60,
    "kind": "page"
  },
  {
    "id": "film-mandapam-v1",
    "design": "mandapam",
    "name": "Kovil Mandapam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "mandapam-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "opening",
          "title": "Opening",
          "scene": "opening",
          "questions": [
            {
              "path": "lang",
              "label": "Lang",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "en",
                "ta"
              ],
              "optionLabels": {
                "en": "English",
                "ta": "Tamil"
              }
            },
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Kovil Mandapam Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "title",
              "label": "Title (gold script)",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "titleTa",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 20
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "brideTa",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 16
            },
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "groomTa",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 16
            },
            {
              "path": "hashtag",
              "label": "Wedding hashtag (optional)",
              "type": "text",
              "required": false,
              "maxLength": 28
            },
            {
              "path": "signTop",
              "label": "Line over the names (script)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "signTopTa",
              "label": "Line over the names",
              "type": "text",
              "required": false,
              "maxLength": 20
            },
            {
              "path": "tagline",
              "label": "Line under the names",
              "type": "textarea",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "taglineTa",
              "label": "Line under the names",
              "type": "textarea",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "sizeOpening",
              "label": "Size Opening",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "blessing",
              "label": "Blessing",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessingTa",
              "label": "Blessing",
              "type": "textarea",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "brideMother",
              "label": "Mother",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "brideFather",
              "label": "Father",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "brideMotherTa",
              "label": "Mother",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "brideFatherTa",
              "label": "Father",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "line",
              "label": "Line under the inviting parents",
              "type": "textarea",
              "required": false,
              "maxLength": 84
            },
            {
              "path": "lineTa",
              "label": "Line under the inviting parents",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "groomMother",
              "label": "Mother",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "groomFather",
              "label": "Father",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "groomMotherTa",
              "label": "Mother",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "groomFatherTa",
              "label": "Father",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "ending",
              "label": "Last line (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 64
            },
            {
              "path": "endingTa",
              "label": "Last line (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 80
            },
            {
              "path": "receptionVenueTa",
              "label": "Reception venue (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 80
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name (the hall)",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "venueLineEn",
              "label": "Address (street, area, town)",
              "type": "text",
              "required": true,
              "maxLength": 48
            },
            {
              "path": "venueTa",
              "label": "Venue (the hall's name, then a comma, then the address)",
              "type": "textarea",
              "required": true,
              "maxLength": 80
            },
            {
              "path": "sizeEvents",
              "label": "Size Events",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "closing",
          "title": "Closing",
          "scene": "closing",
          "questions": [
            {
              "path": "closingTa",
              "label": "Closing line in Tamil",
              "type": "textarea",
              "required": false,
              "maxLength": 30
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "lang": "en",
      "fontSet": "classic",
      "title": "Save the Date",
      "titleTa": "திருமண அழைப்பிதழ்",
      "brideEn": "",
      "brideTa": "",
      "groomEn": "",
      "groomTa": "",
      "order": "bride_first",
      "hashtag": "",
      "signTop": "Wedding Ceremony",
      "signTopTa": "திருமண விழா",
      "tagline": "Forever is just getting started",
      "taglineTa": "இனிய வாழ்க்கையின் தொடக்கம்",
      "sizeOpening": "100",
      "blessing": "With the blessings of our elders",
      "blessingTa": "பெரியோர்களின் நல்லாசியுடன்",
      "brideMother": "",
      "brideFather": "",
      "brideMotherTa": "",
      "brideFatherTa": "",
      "line": "request the pleasure of your company at the wedding of their daughter",
      "lineTa": "இவர்களின் அன்பு மகள்",
      "groomMother": "",
      "groomFather": "",
      "groomMotherTa": "",
      "groomFatherTa": "",
      "ending": "",
      "endingTa": "திருமணத்திற்குத் தங்களை அன்புடன் அழைக்கிறோம்",
      "sizeInvitation": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "venueTa": "",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueTa": "",
      "sizeEvents": "100",
      "closingTa": "உங்கள் வருகை எங்கள் மகிழ்ச்சி",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "lang": "en",
      "fontSet": "classic",
      "title": "Save the Date",
      "titleTa": "திருமண அழைப்பிதழ்",
      "brideEn": "Meera",
      "brideTa": "மீரா",
      "groomEn": "Arvind",
      "groomTa": "அர்விந்த்",
      "order": "bride_first",
      "hashtag": "#MeeraWedsArvind",
      "signTop": "Wedding Ceremony",
      "signTopTa": "திருமண விழா",
      "tagline": "Forever is just getting started",
      "taglineTa": "இனிய வாழ்க்கையின் தொடக்கம்",
      "sizeOpening": "100",
      "blessing": "With the blessings of our elders",
      "blessingTa": "பெரியோர்களின் நல்லாசியுடன்",
      "brideMother": "Mrs Revathi Sundaram",
      "brideFather": "Mr R. Sundaram",
      "brideMotherTa": "திருமதி. ரேவதி சுந்தரம்",
      "brideFatherTa": "திரு. ரா. சுந்தரம்",
      "line": "request the pleasure of your company at the wedding of their daughter",
      "lineTa": "இவர்களின் அன்பு மகள்",
      "groomMother": "Mrs Malathi Raghavan",
      "groomFather": "Mr K. Raghavan",
      "groomMotherTa": "திருமதி. மாலதி ராகவன்",
      "groomFatherTa": "திரு. க. ராகவன்",
      "ending": "",
      "endingTa": "திருமணத்திற்குத் தங்களை அன்புடன் அழைக்கிறோம்",
      "sizeInvitation": "100",
      "weddingDate": "2027-02-19",
      "muhurthamFrom": "09:00",
      "muhurthamTo": "10:30",
      "venueEn": "Arul Kalyana Mandapam",
      "venueLineEn": "Mylapore, Chennai",
      "venueTa": "அருள் கல்யாண மண்டபம், மயிலாப்பூர், சென்னை",
      "receptionDate": "2027-02-18",
      "receptionFrom": "18:00",
      "receptionTo": "",
      "receptionVenue": "Arul Mini Hall, Mylapore, Chennai",
      "receptionVenueTa": "அருள் மினி ஹால், மயிலாப்பூர், சென்னை",
      "sizeEvents": "100",
      "closingTa": "உங்கள் வருகை எங்கள் மகிழ்ச்சி",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "lang": "opening",
      "fontSet": "opening",
      "title": "opening",
      "titleTa": "opening",
      "brideEn": "opening",
      "brideTa": "opening",
      "groomEn": "opening",
      "groomTa": "opening",
      "hashtag": "opening",
      "signTop": "opening",
      "signTopTa": "opening",
      "tagline": "opening",
      "taglineTa": "opening",
      "sizeOpening": "opening",
      "order": "invitation",
      "blessing": "invitation",
      "blessingTa": "invitation",
      "brideMother": "invitation",
      "brideFather": "invitation",
      "groomMother": "invitation",
      "groomFather": "invitation",
      "brideMotherTa": "invitation",
      "brideFatherTa": "invitation",
      "groomMotherTa": "invitation",
      "groomFatherTa": "invitation",
      "line": "invitation",
      "lineTa": "invitation",
      "ending": "invitation",
      "endingTa": "invitation",
      "sizeInvitation": "invitation",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "venueTa": "wedding",
      "sizeEvents": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "receptionVenueTa": "reception",
      "closingTa": "closing"
    },
    "photoSlots": [],
    "duration": 54.2,
    "kind": "plate"
  },
  {
    "id": "film-thottam-v1",
    "design": "thottam",
    "name": "Poo Thottam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "thottam-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "opening",
          "title": "Opening",
          "scene": "opening",
          "questions": [
            {
              "path": "lang",
              "label": "Lang",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "en",
                "ta"
              ],
              "optionLabels": {
                "en": "English",
                "ta": "Tamil"
              }
            },
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Poo Thottam Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "title",
              "label": "Title (gold script)",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "titleTa",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 20
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "brideTa",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 16
            },
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "groomTa",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 16
            },
            {
              "path": "hashtag",
              "label": "Wedding hashtag (optional)",
              "type": "text",
              "required": false,
              "maxLength": 28
            },
            {
              "path": "signTop",
              "label": "Line over the names (script)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "signTopTa",
              "label": "Line over the names",
              "type": "text",
              "required": false,
              "maxLength": 20
            },
            {
              "path": "tagline",
              "label": "Line under the names",
              "type": "textarea",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "taglineTa",
              "label": "Line under the names",
              "type": "textarea",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "sizeOpening",
              "label": "Size Opening",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "invitation",
          "title": "Invitation",
          "scene": "invitation",
          "questions": [
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            },
            {
              "path": "blessing",
              "label": "Blessing",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "blessingTa",
              "label": "Blessing",
              "type": "textarea",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "brideMother",
              "label": "Mother",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "brideFather",
              "label": "Father",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "brideMotherTa",
              "label": "Mother",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "brideFatherTa",
              "label": "Father",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "line",
              "label": "Line under the inviting parents",
              "type": "textarea",
              "required": false,
              "maxLength": 84
            },
            {
              "path": "lineTa",
              "label": "Line under the inviting parents",
              "type": "textarea",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "groomMother",
              "label": "Mother",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "groomFather",
              "label": "Father",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "groomMotherTa",
              "label": "Mother",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "groomFatherTa",
              "label": "Father",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "ending",
              "label": "Last line (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 64
            },
            {
              "path": "endingTa",
              "label": "Last line (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 56
            },
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionDate",
              "label": "Reception date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 80
            },
            {
              "path": "receptionVenueTa",
              "label": "Reception venue (optional)",
              "type": "textarea",
              "required": false,
              "maxLength": 80
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name (the hall)",
              "type": "text",
              "required": true,
              "maxLength": 40
            },
            {
              "path": "venueLineEn",
              "label": "Address (street, area, town)",
              "type": "text",
              "required": true,
              "maxLength": 48
            },
            {
              "path": "venueTa",
              "label": "Venue (the hall's name, then a comma, then the address)",
              "type": "textarea",
              "required": true,
              "maxLength": 80
            },
            {
              "path": "sizeEvents",
              "label": "Size Events",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "closing",
          "title": "Closing",
          "scene": "closing",
          "questions": [
            {
              "path": "closingTa",
              "label": "Closing line in Tamil",
              "type": "textarea",
              "required": false,
              "maxLength": 30
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "lang": "en",
      "fontSet": "classic",
      "title": "Save the Date",
      "titleTa": "திருமண அழைப்பிதழ்",
      "brideEn": "",
      "brideTa": "",
      "groomEn": "",
      "groomTa": "",
      "order": "bride_first",
      "hashtag": "",
      "signTop": "Wedding Ceremony",
      "signTopTa": "திருமண விழா",
      "tagline": "Forever is just getting started",
      "taglineTa": "இனிய வாழ்க்கையின் தொடக்கம்",
      "sizeOpening": "100",
      "blessing": "With the blessings of our elders",
      "blessingTa": "பெரியோர்களின் நல்லாசியுடன்",
      "brideMother": "",
      "brideFather": "",
      "brideMotherTa": "",
      "brideFatherTa": "",
      "line": "request the pleasure of your company at the wedding of their daughter",
      "lineTa": "இவர்களின் அன்பு மகள்",
      "groomMother": "",
      "groomFather": "",
      "groomMotherTa": "",
      "groomFatherTa": "",
      "ending": "",
      "endingTa": "திருமணத்திற்குத் தங்களை அன்புடன் அழைக்கிறோம்",
      "sizeInvitation": "100",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "venueTa": "",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "receptionVenueTa": "",
      "sizeEvents": "100",
      "closingTa": "உங்கள் வருகை எங்கள் மகிழ்ச்சி",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "lang": "en",
      "fontSet": "classic",
      "title": "Save the Date",
      "titleTa": "திருமண அழைப்பிதழ்",
      "brideEn": "Meera",
      "brideTa": "மீரா",
      "groomEn": "Arvind",
      "groomTa": "அர்விந்த்",
      "order": "bride_first",
      "hashtag": "#MeeraWedsArvind",
      "signTop": "Wedding Ceremony",
      "signTopTa": "திருமண விழா",
      "tagline": "Forever is just getting started",
      "taglineTa": "இனிய வாழ்க்கையின் தொடக்கம்",
      "sizeOpening": "100",
      "blessing": "With the blessings of our elders",
      "blessingTa": "பெரியோர்களின் நல்லாசியுடன்",
      "brideMother": "Mrs Revathi Sundaram",
      "brideFather": "Mr R. Sundaram",
      "brideMotherTa": "திருமதி. ரேவதி சுந்தரம்",
      "brideFatherTa": "திரு. ரா. சுந்தரம்",
      "line": "request the pleasure of your company at the wedding of their daughter",
      "lineTa": "இவர்களின் அன்பு மகள்",
      "groomMother": "Mrs Malathi Raghavan",
      "groomFather": "Mr K. Raghavan",
      "groomMotherTa": "திருமதி. மாலதி ராகவன்",
      "groomFatherTa": "திரு. க. ராகவன்",
      "ending": "",
      "endingTa": "திருமணத்திற்குத் தங்களை அன்புடன் அழைக்கிறோம்",
      "sizeInvitation": "100",
      "weddingDate": "2027-02-19",
      "muhurthamFrom": "09:00",
      "muhurthamTo": "10:30",
      "venueEn": "Malar Gardens",
      "venueLineEn": "Anna Nagar, Chennai",
      "venueTa": "மலர் கார்டன்ஸ், அண்ணா நகர், சென்னை",
      "receptionDate": "2027-02-18",
      "receptionFrom": "18:00",
      "receptionTo": "",
      "receptionVenue": "Malar Gardens Lawn, Anna Nagar, Chennai",
      "receptionVenueTa": "மலர் கார்டன்ஸ் புல்வெளி, அண்ணா நகர், சென்னை",
      "sizeEvents": "100",
      "closingTa": "உங்கள் வருகை எங்கள் மகிழ்ச்சி",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "lang": "opening",
      "fontSet": "opening",
      "title": "opening",
      "titleTa": "opening",
      "brideEn": "opening",
      "brideTa": "opening",
      "groomEn": "opening",
      "groomTa": "opening",
      "hashtag": "opening",
      "signTop": "opening",
      "signTopTa": "opening",
      "tagline": "opening",
      "taglineTa": "opening",
      "sizeOpening": "opening",
      "order": "invitation",
      "blessing": "invitation",
      "blessingTa": "invitation",
      "brideMother": "invitation",
      "brideFather": "invitation",
      "groomMother": "invitation",
      "groomFather": "invitation",
      "brideMotherTa": "invitation",
      "brideFatherTa": "invitation",
      "groomMotherTa": "invitation",
      "groomFatherTa": "invitation",
      "line": "invitation",
      "lineTa": "invitation",
      "ending": "invitation",
      "endingTa": "invitation",
      "sizeInvitation": "invitation",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "venueTa": "wedding",
      "sizeEvents": "wedding",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "receptionVenueTa": "reception",
      "closingTa": "closing"
    },
    "photoSlots": [],
    "duration": 53,
    "kind": "plate"
  },
  {
    "id": "film-jannal-v1",
    "design": "jannal",
    "name": "Jannal",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "jannal-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "opening",
          "title": "Opening",
          "scene": "opening",
          "questions": [
            {
              "path": "intro1",
              "label": "First line (small capitals)",
              "type": "text",
              "required": false,
              "maxLength": 14
            },
            {
              "path": "intro2",
              "label": "Second line (script)",
              "type": "text",
              "required": false,
              "maxLength": 12
            },
            {
              "path": "intro3",
              "label": "Third line (script)",
              "type": "text",
              "required": false,
              "maxLength": 12
            },
            {
              "path": "intro4",
              "label": "Last line (small capitals)",
              "type": "text",
              "required": false,
              "maxLength": 8
            },
            {
              "path": "sizeOpening",
              "label": "Size Opening",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "bride",
          "title": "Bride",
          "scene": "bride",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Jannal Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "brideLine",
              "label": "Line under her name (optional)",
              "type": "text",
              "required": false,
              "maxLength": 55
            },
            {
              "path": "sizeNames",
              "label": "Size Names",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "groom",
          "title": "Groom",
          "scene": "groom",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "groomLine",
              "label": "Line under his name (optional)",
              "type": "text",
              "required": false,
              "maxLength": 55
            }
          ]
        },
        {
          "id": "names",
          "title": "Names",
          "scene": "names",
          "questions": []
        },
        {
          "id": "wedding",
          "title": "Muhurtham",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingLabel",
              "label": "Parchment title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "venueEn",
              "label": "Venue name (the hall)",
              "type": "text",
              "required": true,
              "maxLength": 48
            },
            {
              "path": "venueLineEn",
              "label": "Address (street, area, town)",
              "type": "text",
              "required": true,
              "maxLength": 72
            },
            {
              "path": "sizeEvents",
              "label": "Size Events",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionLabel",
              "label": "Card title",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "receptionDate",
              "label": "Reception date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Reception venue",
              "type": "text",
              "required": false,
              "maxLength": 75
            }
          ]
        },
        {
          "id": "closing",
          "title": "Closing",
          "scene": "closing",
          "questions": [
            {
              "path": "closing1",
              "label": "First line (script)",
              "type": "text",
              "required": false,
              "maxLength": 26
            },
            {
              "path": "closing2",
              "label": "Second line (script)",
              "type": "text",
              "required": false,
              "maxLength": 26
            },
            {
              "path": "sizeClosing",
              "label": "Size Closing",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "brideEn": "",
      "brideLine": "",
      "groomEn": "",
      "groomLine": "",
      "sizeNames": "100",
      "intro1": "for the",
      "intro2": "Wedding",
      "intro3": "Ceremony",
      "intro4": "of",
      "sizeOpening": "100",
      "closing1": "Join us on our",
      "closing2": "special day",
      "sizeClosing": "100",
      "weddingLabel": "Muhurtham",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "venueLineEn": "",
      "receptionLabel": "Reception",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "sizeEvents": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "brideEn": "Meera",
      "brideLine": "M.B.B.S., M.D. (Paediatrics)",
      "groomEn": "Arjun",
      "groomLine": "B.E., M.B.A.",
      "sizeNames": "100",
      "intro1": "for the",
      "intro2": "Wedding",
      "intro3": "Ceremony",
      "intro4": "of",
      "sizeOpening": "100",
      "closing1": "Join us on our",
      "closing2": "special day",
      "sizeClosing": "100",
      "weddingLabel": "Muhurtham",
      "weddingDate": "2027-02-12",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "venueEn": "Sri Balaji Kalyana Mandapam",
      "venueLineEn": "Anna Nagar, Chennai",
      "receptionLabel": "Reception",
      "receptionDate": "2027-02-11",
      "receptionFrom": "18:30",
      "receptionTo": "21:30",
      "receptionVenue": "Hotel Green Park, Vadapalani, Chennai",
      "sizeEvents": "100",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "bride",
      "brideEn": "bride",
      "brideLine": "bride",
      "groomEn": "groom",
      "groomLine": "groom",
      "sizeNames": "bride",
      "intro1": "opening",
      "intro2": "opening",
      "intro3": "opening",
      "intro4": "opening",
      "sizeOpening": "opening",
      "closing1": "closing",
      "closing2": "closing",
      "sizeClosing": "closing",
      "weddingLabel": "wedding",
      "weddingDate": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueEn": "wedding",
      "venueLineEn": "wedding",
      "sizeEvents": "wedding",
      "receptionLabel": "reception",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "photoBrideId": "bride",
      "photoBrideBox": "bride",
      "photoGroomId": "groom",
      "photoGroomBox": "groom",
      "photoCoupleId": "names",
      "photoCoupleBox": "names",
      "photoBox": "bride"
    },
    "photoSlots": [
      {
        "slot": "bride",
        "label": "Bride",
        "field": "photoBrideId",
        "box": "photoBrideBox",
        "scene": "bride"
      },
      {
        "slot": "groom",
        "label": "Groom",
        "field": "photoGroomId",
        "box": "photoGroomBox",
        "scene": "groom"
      },
      {
        "slot": "couple",
        "label": "Couple",
        "field": "photoCoupleId",
        "box": "photoCoupleBox",
        "scene": "names"
      }
    ],
    "duration": 44.3,
    "kind": "page"
  },
  {
    "id": "film-poonga-v1",
    "design": "poonga",
    "name": "Aranmanai Poonga",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "poonga-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Aranmanai Classic"
              }
            },
            {
              "path": "title1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "title2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "names",
          "title": "Names",
          "scene": "names",
          "questions": [
            {
              "path": "groomLabel",
              "label": "Label above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomTa",
              "label": "Name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomParentsTa",
              "label": "Parents",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomOf",
              "label": "Line under the parents",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomTown",
              "label": "Town (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideLabel",
              "label": "Label above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTa",
              "label": "Name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideParentsTa",
              "label": "Parents",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideOf",
              "label": "Line under the parents",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTown",
              "label": "Town (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "events",
          "title": "Events",
          "scene": "events",
          "questions": [
            {
              "path": "topLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "receptionDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "topVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "topVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "bottomLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "weddingDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "bottomVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "bottomVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "closing",
          "title": "Closing",
          "scene": "closing",
          "questions": [
            {
              "path": "closing1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing3",
              "label": "Third line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing4",
              "label": "Fourth line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "groomLabel": "மணமகன்",
      "groomTa": "",
      "groomParentsTa": "",
      "groomOf": "அவர்களின் மகன்",
      "groomTown": "",
      "brideLabel": "மணமகள்",
      "brideTa": "",
      "brideParentsTa": "",
      "brideOf": "அவர்களின் மகள்",
      "brideTown": "",
      "topLabel": "வரவேற்பு",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "topVenue": "",
      "topVenue2": "",
      "bottomLabel": "திருமணம்",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "bottomVenue": "",
      "bottomVenue2": "",
      "closing1": "வாருங்கள்",
      "closing2": "வரவேற்கிறோம்",
      "closing3": "வளர்கிறோம்",
      "closing4": "வணங்குகிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "groomLabel": "மணமகன்",
      "groomTa": "கோகுல்",
      "groomParentsTa": "திரு. பார்த்திபன் – திருமதி. ராணி",
      "groomOf": "அவர்களின் மகன்",
      "groomTown": "திருப்பூர்",
      "brideLabel": "மணமகள்",
      "brideTa": "திவ்யா",
      "brideParentsTa": "திரு. குமார் – திருமதி. தேன்மொழி",
      "brideOf": "அவர்களின் மகள்",
      "brideTown": "திருப்பூர்",
      "topLabel": "வரவேற்பு",
      "receptionDate": "2027-02-14",
      "receptionFrom": "18:00",
      "receptionTo": "",
      "topVenue": "பாலாஜி மஹால், திருப்பூர்",
      "topVenue2": "",
      "bottomLabel": "திருமணம்",
      "weddingDate": "2027-02-15",
      "muhurthamFrom": "06:00",
      "muhurthamTo": "07:30",
      "bottomVenue": "பாலாஜி மஹால், திருப்பூர்",
      "bottomVenue2": "",
      "closing1": "வாருங்கள்",
      "closing2": "வரவேற்கிறோம்",
      "closing3": "வளர்கிறோம்",
      "closing4": "வணங்குகிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "title1": "title",
      "title2": "title",
      "groomLabel": "names",
      "groomTa": "names",
      "groomParentsTa": "names",
      "groomOf": "names",
      "groomTown": "names",
      "brideLabel": "names",
      "brideTa": "names",
      "brideParentsTa": "names",
      "brideOf": "names",
      "brideTown": "names",
      "topLabel": "events",
      "receptionDate": "events",
      "receptionFrom": "events",
      "receptionTo": "events",
      "topVenue": "events",
      "topVenue2": "events",
      "bottomLabel": "events",
      "weddingDate": "events",
      "muhurthamFrom": "events",
      "muhurthamTo": "events",
      "bottomVenue": "events",
      "bottomVenue2": "events",
      "closing1": "closing",
      "closing2": "closing",
      "closing3": "closing",
      "closing4": "closing"
    },
    "photoSlots": [],
    "duration": 34,
    "kind": "page"
  },
  {
    "id": "film-roja-v1",
    "design": "roja",
    "name": "Thottam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "roja-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Thottam Classic"
              }
            },
            {
              "path": "title1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "title2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "names",
          "title": "Names",
          "scene": "names",
          "questions": [
            {
              "path": "groomLabel",
              "label": "Label above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomTa",
              "label": "Name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomParentsTa",
              "label": "Parents",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomOf",
              "label": "Line under the parents",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomTown",
              "label": "Town (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideLabel",
              "label": "Label above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTa",
              "label": "Name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideParentsTa",
              "label": "Parents",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideOf",
              "label": "Line under the parents",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTown",
              "label": "Town (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "events",
          "title": "Events",
          "scene": "events",
          "questions": [
            {
              "path": "topLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "receptionDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "topVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "topVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "bottomLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "weddingDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "bottomVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "bottomVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "closing",
          "title": "Closing",
          "scene": "closing",
          "questions": [
            {
              "path": "closing1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing3",
              "label": "Third line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing4",
              "label": "Fourth line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "groomLabel": "மணமகன்",
      "groomTa": "",
      "groomParentsTa": "",
      "groomOf": "அவர்களின் மகன்",
      "groomTown": "",
      "brideLabel": "மணமகள்",
      "brideTa": "",
      "brideParentsTa": "",
      "brideOf": "அவர்களின் மகள்",
      "brideTown": "",
      "topLabel": "வரவேற்பு",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "topVenue": "",
      "topVenue2": "",
      "bottomLabel": "திருமணம்",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "bottomVenue": "",
      "bottomVenue2": "",
      "closing1": "வாருங்கள்",
      "closing2": "வரவேற்கிறோம்",
      "closing3": "வளர்கிறோம்",
      "closing4": "வணங்குகிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "groomLabel": "மணமகன்",
      "groomTa": "கோகுல்",
      "groomParentsTa": "திரு. பார்த்திபன் – திருமதி. ராணி",
      "groomOf": "அவர்களின் மகன்",
      "groomTown": "திருப்பூர்",
      "brideLabel": "மணமகள்",
      "brideTa": "திவ்யா",
      "brideParentsTa": "திரு. குமார் – திருமதி. தேன்மொழி",
      "brideOf": "அவர்களின் மகள்",
      "brideTown": "திருப்பூர்",
      "topLabel": "வரவேற்பு",
      "receptionDate": "2027-02-14",
      "receptionFrom": "18:00",
      "receptionTo": "",
      "topVenue": "ஶ்ரீ பாலாஜி மஹால், திருப்பூர்",
      "topVenue2": "",
      "bottomLabel": "திருமணம்",
      "weddingDate": "2027-02-15",
      "muhurthamFrom": "06:00",
      "muhurthamTo": "07:30",
      "bottomVenue": "ஶ்ரீ பாலாஜி மஹால், திருப்பூர்",
      "bottomVenue2": "",
      "closing1": "வாருங்கள்",
      "closing2": "வரவேற்கிறோம்",
      "closing3": "வளர்கிறோம்",
      "closing4": "வணங்குகிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "title1": "title",
      "title2": "title",
      "groomLabel": "names",
      "groomTa": "names",
      "groomParentsTa": "names",
      "groomOf": "names",
      "groomTown": "names",
      "brideLabel": "names",
      "brideTa": "names",
      "brideParentsTa": "names",
      "brideOf": "names",
      "brideTown": "names",
      "topLabel": "events",
      "receptionDate": "events",
      "receptionFrom": "events",
      "receptionTo": "events",
      "topVenue": "events",
      "topVenue2": "events",
      "bottomLabel": "events",
      "weddingDate": "events",
      "muhurthamFrom": "events",
      "muhurthamTo": "events",
      "bottomVenue": "events",
      "bottomVenue2": "events",
      "closing1": "closing",
      "closing2": "closing",
      "closing3": "closing",
      "closing4": "closing"
    },
    "photoSlots": [],
    "duration": 34,
    "kind": "page"
  },
  {
    "id": "film-malligai-v1",
    "design": "malligai",
    "name": "Malligai Thottam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "malligai-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Malligai Classic"
              }
            },
            {
              "path": "title1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "title2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "names",
          "title": "Names",
          "scene": "names",
          "questions": [
            {
              "path": "groomLabel",
              "label": "Label above the name",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "groomTa",
              "label": "Name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomParentsTa",
              "label": "Parents",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomOf",
              "label": "Line under the parents",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomTown",
              "label": "Town (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideLabel",
              "label": "Label above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTa",
              "label": "Name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideParentsTa",
              "label": "Parents",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideOf",
              "label": "Line under the parents",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTown",
              "label": "Town (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "events",
          "title": "Events",
          "scene": "events",
          "questions": [
            {
              "path": "topLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 12
            },
            {
              "path": "receptionDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "topVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "topVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "bottomLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "weddingDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "bottomVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "bottomVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "closing",
          "title": "Closing",
          "scene": "closing",
          "questions": [
            {
              "path": "closing1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing3",
              "label": "Third line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing4",
              "label": "Fourth line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "groomLabel": "மணமகன்",
      "groomTa": "",
      "groomParentsTa": "",
      "groomOf": "அவர்களின் மகன்",
      "groomTown": "",
      "brideLabel": "மணமகள்",
      "brideTa": "",
      "brideParentsTa": "",
      "brideOf": "அவர்களின் மகள்",
      "brideTown": "",
      "topLabel": "வரவேற்பு",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "topVenue": "",
      "topVenue2": "",
      "bottomLabel": "திருமணம்",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "bottomVenue": "",
      "bottomVenue2": "",
      "closing1": "வாருங்கள்",
      "closing2": "வரவேற்கிறோம்",
      "closing3": "வளர்கிறோம்",
      "closing4": "வணங்குகிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "groomLabel": "மணமகன்",
      "groomTa": "கோகுல்",
      "groomParentsTa": "திரு. பார்த்திபன் – திருமதி. ராணி",
      "groomOf": "அவர்களின் மகன்",
      "groomTown": "திருப்பூர்",
      "brideLabel": "மணமகள்",
      "brideTa": "திவ்யா",
      "brideParentsTa": "திரு. குமார் – திருமதி. தேன்மொழி",
      "brideOf": "அவர்களின் மகள்",
      "brideTown": "திருப்பூர்",
      "topLabel": "வரவேற்பு",
      "receptionDate": "2027-02-14",
      "receptionFrom": "18:00",
      "receptionTo": "",
      "topVenue": "ஶ்ரீ பாலாஜி மஹால், திருப்பூர்",
      "topVenue2": "",
      "bottomLabel": "திருமணம்",
      "weddingDate": "2027-02-15",
      "muhurthamFrom": "06:00",
      "muhurthamTo": "07:30",
      "bottomVenue": "ஶ்ரீ பாலாஜி மஹால், திருப்பூர்",
      "bottomVenue2": "",
      "closing1": "வாருங்கள்",
      "closing2": "வரவேற்கிறோம்",
      "closing3": "வளர்கிறோம்",
      "closing4": "வணங்குகிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "title1": "title",
      "title2": "title",
      "groomLabel": "names",
      "groomTa": "names",
      "groomParentsTa": "names",
      "groomOf": "names",
      "groomTown": "names",
      "brideLabel": "names",
      "brideTa": "names",
      "brideParentsTa": "names",
      "brideOf": "names",
      "brideTown": "names",
      "topLabel": "events",
      "receptionDate": "events",
      "receptionFrom": "events",
      "receptionTo": "events",
      "topVenue": "events",
      "topVenue2": "events",
      "bottomLabel": "events",
      "weddingDate": "events",
      "muhurthamFrom": "events",
      "muhurthamTo": "events",
      "bottomVenue": "events",
      "bottomVenue2": "events",
      "closing1": "closing",
      "closing2": "closing",
      "closing3": "closing",
      "closing4": "closing"
    },
    "photoSlots": [],
    "duration": 34,
    "kind": "page"
  },
  {
    "id": "film-gopuram-v1",
    "design": "gopuram",
    "name": "Gopura Vaasal",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "gopuram-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Gopura Vaasal Classic"
              }
            },
            {
              "path": "title1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "title2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "names",
          "title": "Names",
          "scene": "names",
          "questions": [
            {
              "path": "groomLabel",
              "label": "Label above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomTa",
              "label": "Name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomParentsTa",
              "label": "Parents",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomOf",
              "label": "Line under the parents",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomTown",
              "label": "Town (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideLabel",
              "label": "Label above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTa",
              "label": "Name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideParentsTa",
              "label": "Parents",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideOf",
              "label": "Line under the parents",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTown",
              "label": "Town (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "events",
          "title": "Events",
          "scene": "events",
          "questions": [
            {
              "path": "topLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "receptionDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "topVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "topVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "bottomLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "weddingDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "bottomVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "bottomVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "closing",
          "title": "Closing",
          "scene": "closing",
          "questions": [
            {
              "path": "closing1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing3",
              "label": "Third line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing4",
              "label": "Fourth line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "groomLabel": "மணமகன்",
      "groomTa": "",
      "groomParentsTa": "",
      "groomOf": "அவர்களின் மகன்",
      "groomTown": "",
      "brideLabel": "மணமகள்",
      "brideTa": "",
      "brideParentsTa": "",
      "brideOf": "அவர்களின் மகள்",
      "brideTown": "",
      "topLabel": "வரவேற்பு",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "topVenue": "",
      "topVenue2": "",
      "bottomLabel": "திருமணம்",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "bottomVenue": "",
      "bottomVenue2": "",
      "closing1": "வாருங்கள்",
      "closing2": "வரவேற்கிறோம்",
      "closing3": "வளர்கிறோம்",
      "closing4": "வணங்குகிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "groomLabel": "மணமகன்",
      "groomTa": "கோகுல்",
      "groomParentsTa": "திரு. பார்த்திபன் – திருமதி. ராணி",
      "groomOf": "அவர்களின் மகன்",
      "groomTown": "திருப்பூர்",
      "brideLabel": "மணமகள்",
      "brideTa": "திவ்யா",
      "brideParentsTa": "திரு. குமார் – திருமதி. தேன்மொழி",
      "brideOf": "அவர்களின் மகள்",
      "brideTown": "திருப்பூர்",
      "topLabel": "வரவேற்பு",
      "receptionDate": "2027-02-14",
      "receptionFrom": "18:00",
      "receptionTo": "",
      "topVenue": "பாலாஜி மஹால், திருப்பூர்",
      "topVenue2": "",
      "bottomLabel": "திருமணம்",
      "weddingDate": "2027-02-15",
      "muhurthamFrom": "06:00",
      "muhurthamTo": "07:30",
      "bottomVenue": "அருள்மிகு முருகன் கோவில், திருப்பூர்",
      "bottomVenue2": "",
      "closing1": "வாருங்கள்",
      "closing2": "வரவேற்கிறோம்",
      "closing3": "வளர்கிறோம்",
      "closing4": "வணங்குகிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "title1": "title",
      "title2": "title",
      "groomLabel": "names",
      "groomTa": "names",
      "groomParentsTa": "names",
      "groomOf": "names",
      "groomTown": "names",
      "brideLabel": "names",
      "brideTa": "names",
      "brideParentsTa": "names",
      "brideOf": "names",
      "brideTown": "names",
      "topLabel": "events",
      "receptionDate": "events",
      "receptionFrom": "events",
      "receptionTo": "events",
      "topVenue": "events",
      "topVenue2": "events",
      "bottomLabel": "events",
      "weddingDate": "events",
      "muhurthamFrom": "events",
      "muhurthamTo": "events",
      "bottomVenue": "events",
      "bottomVenue2": "events",
      "closing1": "closing",
      "closing2": "closing",
      "closing3": "closing",
      "closing4": "closing"
    },
    "photoSlots": [],
    "duration": 34,
    "kind": "page"
  },
  {
    "id": "film-theppam-v1",
    "design": "theppam",
    "name": "Theppakulam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "theppam-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Theppakulam Classic"
              }
            },
            {
              "path": "title1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "title2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "names",
          "title": "Names",
          "scene": "names",
          "questions": [
            {
              "path": "groomLabel",
              "label": "Label above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomTa",
              "label": "Name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomParentsTa",
              "label": "Parents",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomOf",
              "label": "Line under the parents",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomTown",
              "label": "Town (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideLabel",
              "label": "Label above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTa",
              "label": "Name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideParentsTa",
              "label": "Parents",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideOf",
              "label": "Line under the parents",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTown",
              "label": "Town (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "events",
          "title": "Events",
          "scene": "events",
          "questions": [
            {
              "path": "topLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "receptionDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "topVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "topVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "bottomLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "weddingDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "bottomVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "bottomVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "closing",
          "title": "Closing",
          "scene": "closing",
          "questions": [
            {
              "path": "closing1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing3",
              "label": "Third line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing4",
              "label": "Fourth line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "groomLabel": "மணமகன்",
      "groomTa": "",
      "groomParentsTa": "",
      "groomOf": "அவர்களின் மகன்",
      "groomTown": "",
      "brideLabel": "மணமகள்",
      "brideTa": "",
      "brideParentsTa": "",
      "brideOf": "அவர்களின் மகள்",
      "brideTown": "",
      "topLabel": "வரவேற்பு",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "topVenue": "",
      "topVenue2": "",
      "bottomLabel": "திருமணம்",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "bottomVenue": "",
      "bottomVenue2": "",
      "closing1": "வாருங்கள்",
      "closing2": "வரவேற்கிறோம்",
      "closing3": "வளர்கிறோம்",
      "closing4": "வணங்குகிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "groomLabel": "மணமகன்",
      "groomTa": "கோகுல்",
      "groomParentsTa": "திரு. பார்த்திபன் – திருமதி. ராணி",
      "groomOf": "அவர்களின் மகன்",
      "groomTown": "திருப்பூர்",
      "brideLabel": "மணமகள்",
      "brideTa": "திவ்யா",
      "brideParentsTa": "திரு. குமார் – திருமதி. தேன்மொழி",
      "brideOf": "அவர்களின் மகள்",
      "brideTown": "திருப்பூர்",
      "topLabel": "வரவேற்பு",
      "receptionDate": "2027-02-14",
      "receptionFrom": "18:00",
      "receptionTo": "",
      "topVenue": "பாலாஜி மஹால், திருப்பூர்",
      "topVenue2": "",
      "bottomLabel": "திருமணம்",
      "weddingDate": "2027-02-15",
      "muhurthamFrom": "06:00",
      "muhurthamTo": "07:30",
      "bottomVenue": "அருள்மிகு முருகன் கோவில், திருப்பூர்",
      "bottomVenue2": "",
      "closing1": "வாருங்கள்",
      "closing2": "வரவேற்கிறோம்",
      "closing3": "வளர்கிறோம்",
      "closing4": "வணங்குகிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "title1": "title",
      "title2": "title",
      "groomLabel": "names",
      "groomTa": "names",
      "groomParentsTa": "names",
      "groomOf": "names",
      "groomTown": "names",
      "brideLabel": "names",
      "brideTa": "names",
      "brideParentsTa": "names",
      "brideOf": "names",
      "brideTown": "names",
      "topLabel": "events",
      "receptionDate": "events",
      "receptionFrom": "events",
      "receptionTo": "events",
      "topVenue": "events",
      "topVenue2": "events",
      "bottomLabel": "events",
      "weddingDate": "events",
      "muhurthamFrom": "events",
      "muhurthamTo": "events",
      "bottomVenue": "events",
      "bottomVenue2": "events",
      "closing1": "closing",
      "closing2": "closing",
      "closing3": "closing",
      "closing4": "closing"
    },
    "photoSlots": [],
    "duration": 34,
    "kind": "page"
  },
  {
    "id": "film-chettinad-v1",
    "design": "chettinad",
    "name": "Chettinad Kovil",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "chettinad-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Chettinad Kovil Classic"
              }
            },
            {
              "path": "title1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "title2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "names",
          "title": "Names",
          "scene": "names",
          "questions": [
            {
              "path": "groomLabel",
              "label": "Label above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomTa",
              "label": "Name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomParentsTa",
              "label": "Parents",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomOf",
              "label": "Line under the parents",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomTown",
              "label": "Town (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideLabel",
              "label": "Label above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTa",
              "label": "Name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideParentsTa",
              "label": "Parents",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideOf",
              "label": "Line under the parents",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTown",
              "label": "Town (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "events",
          "title": "Events",
          "scene": "events",
          "questions": [
            {
              "path": "topLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "receptionDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "topVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "topVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "bottomLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "weddingDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "bottomVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "bottomVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "closing",
          "title": "Closing",
          "scene": "closing",
          "questions": [
            {
              "path": "closing1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing3",
              "label": "Third line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing4",
              "label": "Fourth line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "groomLabel": "மணமகன்",
      "groomTa": "",
      "groomParentsTa": "",
      "groomOf": "அவர்களின் மகன்",
      "groomTown": "",
      "brideLabel": "மணமகள்",
      "brideTa": "",
      "brideParentsTa": "",
      "brideOf": "அவர்களின் மகள்",
      "brideTown": "",
      "topLabel": "வரவேற்பு",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "topVenue": "",
      "topVenue2": "",
      "bottomLabel": "திருமணம்",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "bottomVenue": "",
      "bottomVenue2": "",
      "closing1": "வாருங்கள்",
      "closing2": "வரவேற்கிறோம்",
      "closing3": "வளர்கிறோம்",
      "closing4": "வணங்குகிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "groomLabel": "மணமகன்",
      "groomTa": "கோகுல்",
      "groomParentsTa": "திரு. பார்த்திபன் – திருமதி. ராணி",
      "groomOf": "அவர்களின் மகன்",
      "groomTown": "திருப்பூர்",
      "brideLabel": "மணமகள்",
      "brideTa": "திவ்யா",
      "brideParentsTa": "திரு. குமார் – திருமதி. தேன்மொழி",
      "brideOf": "அவர்களின் மகள்",
      "brideTown": "திருப்பூர்",
      "topLabel": "வரவேற்பு",
      "receptionDate": "2027-02-14",
      "receptionFrom": "18:00",
      "receptionTo": "",
      "topVenue": "பாலாஜி மஹால், திருப்பூர்",
      "topVenue2": "",
      "bottomLabel": "திருமணம்",
      "weddingDate": "2027-02-15",
      "muhurthamFrom": "06:00",
      "muhurthamTo": "07:30",
      "bottomVenue": "அருள்மிகு முருகன் கோவில், திருப்பூர்",
      "bottomVenue2": "",
      "closing1": "வாருங்கள்",
      "closing2": "வரவேற்கிறோம்",
      "closing3": "வளர்கிறோம்",
      "closing4": "வணங்குகிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "title1": "title",
      "title2": "title",
      "groomLabel": "names",
      "groomTa": "names",
      "groomParentsTa": "names",
      "groomOf": "names",
      "groomTown": "names",
      "brideLabel": "names",
      "brideTa": "names",
      "brideParentsTa": "names",
      "brideOf": "names",
      "brideTown": "names",
      "topLabel": "events",
      "receptionDate": "events",
      "receptionFrom": "events",
      "receptionTo": "events",
      "topVenue": "events",
      "topVenue2": "events",
      "bottomLabel": "events",
      "weddingDate": "events",
      "muhurthamFrom": "events",
      "muhurthamTo": "events",
      "bottomVenue": "events",
      "bottomVenue2": "events",
      "closing1": "closing",
      "closing2": "closing",
      "closing3": "closing",
      "closing4": "closing"
    },
    "photoSlots": [],
    "duration": 34,
    "kind": "page"
  },
  {
    "id": "film-kalyana-v1",
    "design": "kalyana",
    "name": "Kalyana Poster",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "kalyana-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Kalyana Poster"
              }
            },
            {
              "path": "title1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 14
            },
            {
              "path": "title2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 14
            },
            {
              "path": "sign1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "sign2",
              "label": "Big line",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "sign3",
              "label": "Last line",
              "type": "text",
              "required": false,
              "maxLength": 24
            }
          ]
        },
        {
          "id": "names",
          "title": "Names",
          "scene": "names",
          "questions": [
            {
              "path": "coupleLabel",
              "label": "Word above the names",
              "type": "text",
              "required": false,
              "maxLength": 18
            },
            {
              "path": "groomTa",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 18
            },
            {
              "path": "groomTag",
              "label": "Line under the groom's name",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "brideTa",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 18
            },
            {
              "path": "brideTag",
              "label": "Line under the bride's name",
              "type": "text",
              "required": false,
              "maxLength": 24
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "tvLine",
              "label": "TV line above the date",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "weddingLabel",
              "label": "Card heading",
              "type": "text",
              "required": false,
              "maxLength": 18
            },
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamLabel",
              "label": "Muhurtham line",
              "type": "text",
              "required": false,
              "maxLength": 18
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "weddingVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 34
            },
            {
              "path": "weddingVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 34
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionLabel",
              "label": "Plaque word",
              "type": "text",
              "required": false,
              "maxLength": 18
            },
            {
              "path": "receptionDate",
              "label": "Date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 34
            }
          ]
        },
        {
          "id": "photo",
          "title": "Photo",
          "scene": "photo",
          "questions": []
        },
        {
          "id": "closing",
          "title": "Closing",
          "scene": "closing",
          "questions": [
            {
              "path": "closing1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "closing2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "closing3",
              "label": "Third line",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "closing4",
              "label": "Fourth line",
              "type": "text",
              "required": false,
              "maxLength": 24
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "sign1": "எங்களுக்கு",
      "sign2": "கல்யாணம்",
      "sign3": "எல்லாரும் வந்துருங்க",
      "coupleLabel": "மணமக்கள்",
      "groomTa": "",
      "groomTag": "என்கிற மணமகனுக்கும்",
      "brideTa": "",
      "brideTag": "என்கிற மணமகளுக்கும்",
      "tvLine": "நாள் குறிச்சாச்சு!",
      "weddingLabel": "திருமணம்",
      "weddingDate": "",
      "muhurthamLabel": "சுப முகூர்த்தம்",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "weddingVenue": "",
      "weddingVenue2": "",
      "receptionLabel": "வரவேற்பு",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "closing1": "வாழ்த்த வருகை தரும்",
      "closing2": "அனைவரையும்",
      "closing3": "வருக! வருக!",
      "closing4": "என வரவேற்கிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "title1": "திருமண",
      "title2": "அழைப்பிதழ்",
      "sign1": "எங்களுக்கு",
      "sign2": "கல்யாணம்",
      "sign3": "எல்லாரும் வந்துருங்க",
      "coupleLabel": "மணமக்கள்",
      "groomTa": "கோகுல்",
      "groomTag": "என்கிற மணமகனுக்கும்",
      "brideTa": "திவ்யா",
      "brideTag": "என்கிற மணமகளுக்கும்",
      "tvLine": "நாள் குறிச்சாச்சு!",
      "weddingLabel": "திருமணம்",
      "weddingDate": "2028-01-01",
      "muhurthamLabel": "சுப முகூர்த்தம்",
      "muhurthamFrom": "07:30",
      "muhurthamTo": "09:00",
      "weddingVenue": "அருள்மிகு முருகன் திருக்கோயில்,",
      "weddingVenue2": "திருத்தணி",
      "receptionLabel": "வரவேற்பு",
      "receptionDate": "2028-01-02",
      "receptionFrom": "18:30",
      "receptionTo": "",
      "receptionVenue": "ஶ்ரீ பாலாஜி மஹால், சென்னை",
      "closing1": "வாழ்த்த வருகை தரும்",
      "closing2": "அனைவரையும்",
      "closing3": "வருக! வருக!",
      "closing4": "என வரவேற்கிறோம்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "title1": "title",
      "title2": "title",
      "sign1": "title",
      "sign2": "title",
      "sign3": "title",
      "coupleLabel": "names",
      "groomTa": "names",
      "groomTag": "names",
      "brideTa": "names",
      "brideTag": "names",
      "tvLine": "wedding",
      "weddingLabel": "wedding",
      "weddingDate": "wedding",
      "muhurthamLabel": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "weddingVenue": "wedding",
      "weddingVenue2": "wedding",
      "receptionLabel": "reception",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "closing1": "closing",
      "closing2": "closing",
      "closing3": "closing",
      "closing4": "closing",
      "photoId": "photo",
      "photoBox": "photo"
    },
    "photoSlots": [
      {
        "slot": "couple",
        "label": "Couple photo",
        "field": "photoId",
        "box": "photoBox",
        "scene": "photo"
      }
    ],
    "duration": 36,
    "kind": "page"
  },
  {
    "id": "film-avalum-v1",
    "design": "avalum",
    "name": "Avalum Nanum",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "avalum-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "verse",
          "title": "Kural",
          "scene": "verse",
          "questions": [
            {
              "path": "verse1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "verse2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "verseSource",
              "label": "Source line",
              "type": "text",
              "required": false,
              "maxLength": 24
            }
          ]
        },
        {
          "id": "names",
          "title": "Names",
          "scene": "names",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Avalum Nanum Classic"
              }
            },
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "namesSub",
              "label": "Line in capitals",
              "type": "text",
              "required": false,
              "maxLength": 26
            }
          ]
        },
        {
          "id": "invite",
          "title": "Invitation",
          "scene": "invite",
          "questions": [
            {
              "path": "invite1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "invite2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "invite3",
              "label": "Third line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "date",
          "title": "Date",
          "scene": "date",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            }
          ]
        },
        {
          "id": "events",
          "title": "Wedding & reception",
          "scene": "events",
          "questions": [
            {
              "path": "weddingLabel",
              "label": "Name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "weddingVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "receptionLabel",
              "label": "Name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "receptionDate",
              "label": "Date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "town",
              "label": "Town or city",
              "type": "text",
              "required": true,
              "maxLength": 24
            }
          ]
        },
        {
          "id": "thanks",
          "title": "Thank you",
          "scene": "thanks",
          "questions": [
            {
              "path": "thanks1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "thanks2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "thanks3",
              "label": "Script line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "verse1": "அன்பும் அறனும் உடைத்தாயின் இல்வாழ்க்கை",
      "verse2": "பண்பும் பயனும் அது.",
      "verseSource": "— திருக்குறள் 45",
      "groomEn": "",
      "brideEn": "",
      "namesSub": "WE ARE GETTING MARRIED",
      "invite1": "With love and joy",
      "invite2": "we invite you",
      "invite3": "to our wedding",
      "weddingDate": "",
      "weddingLabel": "Muhurtham",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "weddingVenue": "",
      "receptionLabel": "Reception",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionVenue": "",
      "town": "",
      "thanks1": "We look forward to",
      "thanks2": "celebrating with you",
      "thanks3": "With love, both families",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "verse1": "அன்பும் அறனும் உடைத்தாயின் இல்வாழ்க்கை",
      "verse2": "பண்பும் பயனும் அது.",
      "verseSource": "— திருக்குறள் 45",
      "groomEn": "Arun",
      "brideEn": "Kayal",
      "namesSub": "WE ARE GETTING MARRIED",
      "invite1": "With love and joy",
      "invite2": "we invite you",
      "invite3": "to our wedding",
      "weddingDate": "2027-02-21",
      "weddingLabel": "Muhurtham",
      "muhurthamFrom": "09:00",
      "muhurthamTo": "10:30",
      "weddingVenue": "Sri Vasantham Kalyana Mahal",
      "receptionLabel": "Reception",
      "receptionDate": "2027-02-20",
      "receptionFrom": "18:30",
      "receptionVenue": "Thamarai Hall",
      "town": "Madurai",
      "thanks1": "We look forward to",
      "thanks2": "celebrating with you",
      "thanks3": "With love, both families",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "names",
      "verse1": "verse",
      "verse2": "verse",
      "verseSource": "verse",
      "groomEn": "names",
      "brideEn": "names",
      "namesSub": "names",
      "invite1": "invite",
      "invite2": "invite",
      "invite3": "invite",
      "weddingDate": "date",
      "weddingLabel": "events",
      "muhurthamFrom": "events",
      "muhurthamTo": "events",
      "weddingVenue": "events",
      "receptionLabel": "events",
      "receptionDate": "events",
      "receptionFrom": "events",
      "receptionVenue": "events",
      "town": "events",
      "thanks1": "thanks",
      "thanks2": "thanks",
      "thanks3": "thanks"
    },
    "photoSlots": [],
    "duration": 50,
    "kind": "page"
  },
  {
    "id": "film-thamarai-v1",
    "design": "thamarai",
    "name": "Thamarai",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "thamarai-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Thamarai"
              }
            },
            {
              "path": "crest",
              "label": "Line under Ganesha",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "subtitle1",
              "label": "First line above the title",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "subtitle2",
              "label": "Second line above the title",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "title",
              "label": "Big title",
              "type": "text",
              "required": false,
              "maxLength": 18
            },
            {
              "path": "invite1",
              "label": "Invitation, first line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "invite2",
              "label": "Invitation, second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "invite3",
              "label": "Invitation, third line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "couple",
          "title": "Couple",
          "scene": "couple",
          "questions": [
            {
              "path": "groomLabel",
              "label": "Word above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomTa",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "groomFather",
              "label": "Father's name (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "groomMother",
              "label": "Mother's name (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideLabel",
              "label": "Word above the name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideTa",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideFather",
              "label": "Father's name (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "brideMother",
              "label": "Mother's name (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "wedding",
          "title": "Wedding",
          "scene": "wedding",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamLabel",
              "label": "Word before the time",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "venueLabel",
              "label": "Word above the venue",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "weddingVenue",
              "label": "Venue",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "weddingVenue2",
              "label": "Venue, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "reception",
          "title": "Reception",
          "scene": "reception",
          "questions": [
            {
              "path": "receptionLabel",
              "label": "Heading",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "receptionDate",
              "label": "Date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "receptionFrom",
              "label": "Reception From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionTo",
              "label": "Reception To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "receptionVenue",
              "label": "Venue (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "regards",
          "title": "Families",
          "scene": "regards",
          "questions": [
            {
              "path": "regardsLabel",
              "label": "Line above",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "family1",
              "label": "Families' names",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "family2",
              "label": "Line under the names",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "crest": "ஶ்ரீ கணேசாய நம:",
      "subtitle1": "இரு இதயங்கள் இணையும்",
      "subtitle2": "இனிய திருமண விழா",
      "title": "திருமண அழைப்பிதழ்",
      "invite1": "இறைவன் திருவருளால்",
      "invite2": "எங்கள் இல்லத் திருமணத்திற்கு",
      "invite3": "தங்களை அன்புடன் அழைக்கிறோம்",
      "groomLabel": "மணமகன்",
      "groomTa": "",
      "groomFather": "",
      "groomMother": "",
      "brideLabel": "மணமகள்",
      "brideTa": "",
      "brideFather": "",
      "brideMother": "",
      "weddingDate": "",
      "muhurthamLabel": "முகூர்த்தம்",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueLabel": "இடம்",
      "weddingVenue": "",
      "weddingVenue2": "",
      "receptionLabel": "வரவேற்பு",
      "receptionDate": "",
      "receptionFrom": "",
      "receptionTo": "",
      "receptionVenue": "",
      "regardsLabel": "அன்புடன் அழைக்கும்",
      "family1": "",
      "family2": "குடும்பத்தினர்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "crest": "ஶ்ரீ கணேசாய நம:",
      "subtitle1": "இரு இதயங்கள் இணையும்",
      "subtitle2": "இனிய திருமண விழா",
      "title": "திருமண அழைப்பிதழ்",
      "invite1": "இறைவன் திருவருளால்",
      "invite2": "எங்கள் இல்லத் திருமணத்திற்கு",
      "invite3": "தங்களை அன்புடன் அழைக்கிறோம்",
      "groomLabel": "மணமகன்",
      "groomTa": "அருண் குமார்",
      "groomFather": "செல்வம்",
      "groomMother": "மீனா",
      "brideLabel": "மணமகள்",
      "brideTa": "கவிதா",
      "brideFather": "ராஜன்",
      "brideMother": "லதா",
      "weddingDate": "2027-02-15",
      "muhurthamLabel": "முகூர்த்தம்",
      "muhurthamFrom": "06:00",
      "muhurthamTo": "07:30",
      "venueLabel": "இடம்",
      "weddingVenue": "ஶ்ரீ பாலாஜி திருமண மஹால்",
      "weddingVenue2": "திருப்பூர்",
      "receptionLabel": "வரவேற்பு",
      "receptionDate": "2027-02-14",
      "receptionFrom": "18:00",
      "receptionTo": "",
      "receptionVenue": "ஶ்ரீ பாலாஜி திருமண மஹால்",
      "regardsLabel": "அன்புடன் அழைக்கும்",
      "family1": "செல்வம் – ராஜன்",
      "family2": "குடும்பத்தினர்",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "crest": "title",
      "subtitle1": "title",
      "subtitle2": "title",
      "title": "title",
      "invite1": "title",
      "invite2": "title",
      "invite3": "title",
      "groomLabel": "couple",
      "groomTa": "couple",
      "groomFather": "couple",
      "groomMother": "couple",
      "brideLabel": "couple",
      "brideTa": "couple",
      "brideFather": "couple",
      "brideMother": "couple",
      "weddingDate": "wedding",
      "muhurthamLabel": "wedding",
      "muhurthamFrom": "wedding",
      "muhurthamTo": "wedding",
      "venueLabel": "wedding",
      "weddingVenue": "wedding",
      "weddingVenue2": "wedding",
      "receptionLabel": "reception",
      "receptionDate": "reception",
      "receptionFrom": "reception",
      "receptionTo": "reception",
      "receptionVenue": "reception",
      "regardsLabel": "regards",
      "family1": "regards",
      "family2": "regards"
    },
    "photoSlots": [],
    "duration": 33,
    "kind": "page"
  },
  {
    "id": "film-savedate-v1",
    "design": "savedate",
    "name": "Save the Date",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "savedate-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Save the Date",
          "scene": "title",
          "questions": []
        },
        {
          "id": "couple",
          "title": "Couple",
          "scene": "couple",
          "questions": [
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "order",
              "label": "Order",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "groom_first",
                "bride_first"
              ],
              "optionLabels": {
                "groom_first": "Groom’s family first",
                "bride_first": "Bride’s family first"
              }
            }
          ]
        },
        {
          "id": "bride",
          "title": "Bride",
          "scene": "bride",
          "questions": [
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": false,
              "maxLength": 40
            }
          ]
        },
        {
          "id": "groom",
          "title": "Groom",
          "scene": "groom",
          "questions": [
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": false,
              "maxLength": 40
            }
          ]
        },
        {
          "id": "when",
          "title": "Date & time",
          "scene": "when",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": false,
              "maxLength": 5
            }
          ]
        },
        {
          "id": "venue",
          "title": "Venue",
          "scene": "venue",
          "questions": [
            {
              "path": "venueEn",
              "label": "Venue and town",
              "type": "text",
              "required": true,
              "maxLength": 70
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "groomEn": "",
      "brideEn": "",
      "order": "groom_first",
      "brideParents": "",
      "groomParents": "",
      "weddingDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "venueEn": "",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "groomEn": "Rajesh",
      "brideEn": "Priya",
      "order": "groom_first",
      "brideParents": "Ramesh - Prema",
      "groomParents": "Santhanam - Vijaya",
      "weddingDate": "2026-09-29",
      "muhurthamFrom": "06:00",
      "muhurthamTo": "07:30",
      "venueEn": "Grand Palace Convention Centre, Chennai.",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "groomEn": "couple",
      "brideEn": "couple",
      "order": "couple",
      "brideParents": "bride",
      "groomParents": "groom",
      "weddingDate": "when",
      "muhurthamFrom": "when",
      "muhurthamTo": "when",
      "venueEn": "venue"
    },
    "photoSlots": [],
    "duration": 31.5,
    "kind": "plate"
  },
  {
    "id": "film-kulam-v1",
    "design": "kulam",
    "name": "Thamarai Kulam",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "kulam-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "names",
          "title": "Logo & names",
          "scene": "names",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Thamarai Classic"
              }
            },
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 18
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 18
            }
          ]
        },
        {
          "id": "invite",
          "title": "Invitation",
          "scene": "invite",
          "questions": [
            {
              "path": "blessing",
              "label": "Blessing line",
              "type": "text",
              "required": false,
              "maxLength": 40
            },
            {
              "path": "hostIntro",
              "label": "Line before the names",
              "type": "text",
              "required": false,
              "maxLength": 42
            },
            {
              "path": "hosts",
              "label": "Who invites",
              "type": "text",
              "required": true,
              "maxLength": 84
            },
            {
              "path": "request1",
              "label": "Request, first line",
              "type": "text",
              "required": false,
              "maxLength": 46
            },
            {
              "path": "request2",
              "label": "Request, second line",
              "type": "text",
              "required": false,
              "maxLength": 46
            },
            {
              "path": "request3",
              "label": "Request, third line",
              "type": "text",
              "required": false,
              "maxLength": 46
            },
            {
              "path": "groomParents",
              "label": "Groom's parents",
              "type": "text",
              "required": true,
              "maxLength": 80
            },
            {
              "path": "brideParents",
              "label": "Bride's parents",
              "type": "text",
              "required": true,
              "maxLength": 80
            }
          ]
        },
        {
          "id": "date",
          "title": "Save the Date",
          "scene": "date",
          "questions": [
            {
              "path": "stdTitle",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 18
            },
            {
              "path": "stdSub",
              "label": "Line under it",
              "type": "text",
              "required": false,
              "maxLength": 40
            },
            {
              "path": "weddingLabel",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "weddingDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "weddingFrom",
              "label": "Wedding From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "weddingTo",
              "label": "Wedding To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "extra1Label",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "extra1Day",
              "label": "Date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "extra1From",
              "label": "Extra1From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "extra1To",
              "label": "Extra1To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "extra2Label",
              "label": "Event name",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "extra2Day",
              "label": "Date (optional)",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "extra2From",
              "label": "Extra2From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "extra2To",
              "label": "Extra2To",
              "type": "time",
              "required": false,
              "maxLength": 5
            }
          ]
        },
        {
          "id": "venue",
          "title": "Venue",
          "scene": "venue",
          "questions": [
            {
              "path": "venue1Title",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "venue1Hall",
              "label": "Hall or temple name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "venue1Addr1",
              "label": "Address, first line",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "venue1Addr2",
              "label": "Address, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "venue1Addr3",
              "label": "Address, third line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "venue2Title",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "venue2Hall",
              "label": "Hall or temple name (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "venue2Addr1",
              "label": "Address, first line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "venue2Addr2",
              "label": "Address, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "venue2Addr3",
              "label": "Address, third line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "venue3Title",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "venue3Hall",
              "label": "Hall or temple name (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "venue3Addr1",
              "label": "Address, first line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "venue3Addr2",
              "label": "Address, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "venue3Addr3",
              "label": "Address, third line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "closing",
          "title": "Closing",
          "scene": "closing",
          "questions": [
            {
              "path": "closingTitle",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 26
            },
            {
              "path": "closing1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "family",
              "label": "Family name",
              "type": "text",
              "required": true,
              "maxLength": 40
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "groomEn": "",
      "brideEn": "",
      "blessing": "|| Sri Ganeshaya Namaha ||",
      "hostIntro": "With the heavenly blessings of",
      "hosts": "",
      "request1": "cordially request you to save the date",
      "request2": "for the wedding celebration of the perfect",
      "request3": "match of their beloved grandson",
      "groomParents": "",
      "brideParents": "",
      "stdTitle": "Save the Date",
      "stdSub": "For the wedding celebration",
      "weddingLabel": "Muhurtham",
      "weddingDate": "",
      "weddingFrom": "",
      "weddingTo": "",
      "extra1Label": "",
      "extra1Day": "",
      "extra1From": "",
      "extra1To": "",
      "extra2Label": "",
      "extra2Day": "",
      "extra2From": "",
      "extra2To": "",
      "venue1Title": "Wedding Venue",
      "venue1Hall": "",
      "venue1Addr1": "",
      "venue1Addr2": "",
      "venue1Addr3": "",
      "venue2Title": "Reception Venue",
      "venue2Hall": "",
      "venue2Addr1": "",
      "venue2Addr2": "",
      "venue2Addr3": "",
      "venue3Title": "Venue",
      "venue3Hall": "",
      "venue3Addr1": "",
      "venue3Addr2": "",
      "venue3Addr3": "",
      "closingTitle": "Can't wait to see you!",
      "closing1": "Formal invite will be coming soon",
      "closing2": "In anticipation",
      "family": "",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "groomEn": "Arjun",
      "brideEn": "Meera",
      "blessing": "|| Sri Ganeshaya Namaha ||",
      "hostIntro": "With the heavenly blessings of",
      "hosts": "Mr. K. Raghavan & Mrs. Kamala Raghavan",
      "request1": "cordially request you to save the date",
      "request2": "for the wedding celebration of the perfect",
      "request3": "match of their beloved grandson",
      "groomParents": "Mr. R. Suresh & Mrs. Kavitha Suresh",
      "brideParents": "Mr. S. Prakash & Mrs. Revathi Prakash",
      "stdTitle": "Save the Date",
      "stdSub": "For the wedding celebration",
      "weddingLabel": "Muhurtham",
      "weddingDate": "2027-02-12",
      "weddingFrom": "07:30",
      "weddingTo": "09:00",
      "extra1Label": "Nichayathartham",
      "extra1Day": "2027-02-11",
      "extra1From": "18:00",
      "extra1To": "",
      "extra2Label": "Reception",
      "extra2Day": "2027-02-12",
      "extra2From": "18:30",
      "extra2To": "",
      "venue1Title": "Wedding Venue",
      "venue1Hall": "Sri Balaji Kalyana Mandapam",
      "venue1Addr1": "No. 12, Anna Salai, T. Nagar",
      "venue1Addr2": "Chennai - 600 017",
      "venue1Addr3": "",
      "venue2Title": "Reception Venue",
      "venue2Hall": "Hotel Green Park",
      "venue2Addr1": "No. 183, Arcot Road, Vadapalani",
      "venue2Addr2": "Chennai - 600 026",
      "venue2Addr3": "",
      "venue3Title": "Venue",
      "venue3Hall": "",
      "venue3Addr1": "",
      "venue3Addr2": "",
      "venue3Addr3": "",
      "closingTitle": "Can't wait to see you!",
      "closing1": "Formal invite will be coming soon",
      "closing2": "In anticipation",
      "family": "Raghavan Family",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "names",
      "groomEn": "names",
      "brideEn": "names",
      "blessing": "invite",
      "hostIntro": "invite",
      "hosts": "invite",
      "request1": "invite",
      "request2": "invite",
      "request3": "invite",
      "groomParents": "invite",
      "brideParents": "invite",
      "stdTitle": "date",
      "stdSub": "date",
      "weddingLabel": "date",
      "weddingDate": "date",
      "weddingFrom": "date",
      "weddingTo": "date",
      "extra1Label": "date",
      "extra1Day": "date",
      "extra1From": "date",
      "extra1To": "date",
      "extra2Label": "date",
      "extra2Day": "date",
      "extra2From": "date",
      "extra2To": "date",
      "venue1Title": "venue",
      "venue1Hall": "venue",
      "venue1Addr1": "venue",
      "venue1Addr2": "venue",
      "venue1Addr3": "venue",
      "venue2Title": "venue",
      "venue2Hall": "venue",
      "venue2Addr1": "venue",
      "venue2Addr2": "venue",
      "venue2Addr3": "venue",
      "venue3Title": "venue",
      "venue3Hall": "venue",
      "venue3Addr1": "venue",
      "venue3Addr2": "venue",
      "venue3Addr3": "venue",
      "closingTitle": "closing",
      "closing1": "closing",
      "closing2": "closing",
      "family": "closing"
    },
    "photoSlots": [],
    "duration": 63,
    "kind": "page"
  },
  {
    "id": "film-karaikudi-v1",
    "design": "karaikudi",
    "name": "Karaikudi",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "karaikudi-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Karaikudi Classic"
              }
            },
            {
              "path": "title1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "title2",
              "label": "Second line",
              "type": "text",
              "required": true,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "names",
          "title": "Names",
          "scene": "names",
          "questions": [
            {
              "path": "kicker",
              "label": "Script line",
              "type": "text",
              "required": false,
              "maxLength": 18
            },
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "details",
          "title": "Details",
          "scene": "details",
          "questions": [
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "line2",
              "label": "Second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "line3",
              "label": "Third line",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "line4",
              "label": "Fourth line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "closing",
              "label": "Script line",
              "type": "text",
              "required": false,
              "maxLength": 30
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "title1": "You're invited to a",
      "title2": "",
      "kicker": "Save the Date",
      "groomEn": "",
      "brideEn": "",
      "weddingDate": "",
      "line2": "",
      "line3": "",
      "line4": "",
      "closing": "Your presence is our blessing",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "title1": "You're invited to a",
      "title2": "wedding in Karaikudi",
      "kicker": "Save the Date",
      "groomEn": "Arun",
      "brideEn": "Meena",
      "weddingDate": "2027-02-15",
      "line2": "Muhurtham · 6.00 – 7.30 am",
      "line3": "Sri Meenakshi Mahal, Karaikudi",
      "line4": "Reception · February 14 · 6.30 pm onwards",
      "closing": "Your presence is our blessing",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "title1": "title",
      "title2": "title",
      "kicker": "names",
      "groomEn": "names",
      "brideEn": "names",
      "weddingDate": "details",
      "line2": "details",
      "line3": "details",
      "line4": "details",
      "closing": "details"
    },
    "photoSlots": [],
    "duration": 31.5,
    "kind": "page"
  },
  {
    "id": "film-hopon-v1",
    "design": "hopon",
    "name": "Hop On",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "hopon-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "quote",
          "title": "Quote",
          "scene": "quote",
          "questions": [
            {
              "path": "quote1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "quote2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 120
            }
          ]
        },
        {
          "id": "wall",
          "title": "Names & date",
          "scene": "wall",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Hop On"
              }
            },
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 120
            },
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "quote1": "He said, “Hop on.”",
      "quote2": "She said, “Only if it’s forever.”",
      "groomEn": "",
      "brideEn": "",
      "weddingDate": "",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "quote1": "He said, “Hop on.”",
      "quote2": "She said, “Only if it’s forever.”",
      "groomEn": "Arun",
      "brideEn": "Kaviya",
      "weddingDate": "2026-12-17",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "wall",
      "quote1": "quote",
      "quote2": "quote",
      "groomEn": "wall",
      "brideEn": "wall",
      "weddingDate": "wall"
    },
    "photoSlots": [],
    "duration": 18,
    "kind": "page"
  },
  {
    "id": "film-oonjal-v1",
    "design": "oonjal",
    "name": "Maapla Veetla Double okay :P",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "oonjal-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "opening",
          "title": "Opening",
          "scene": "opening",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Mapla Veetla Okay"
              }
            },
            {
              "path": "intro1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 22
            },
            {
              "path": "intro2",
              "label": "Second line (big)",
              "type": "text",
              "required": false,
              "maxLength": 14
            },
            {
              "path": "intro3",
              "label": "Third line (big)",
              "type": "text",
              "required": false,
              "maxLength": 14
            },
            {
              "path": "intro4",
              "label": "Last line (a small heart follows it)",
              "type": "text",
              "required": false,
              "maxLength": 20
            }
          ]
        },
        {
          "id": "bride",
          "title": "Bride",
          "scene": "bride",
          "questions": [
            {
              "path": "brideKicker",
              "label": "Word above the bride's name",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "brideEn",
              "label": "Bride's name",
              "type": "text",
              "required": true,
              "maxLength": 12
            }
          ]
        },
        {
          "id": "swing",
          "title": "Swing",
          "scene": "swing",
          "questions": [
            {
              "path": "wonder1",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 20
            },
            {
              "path": "wonder2",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 20
            },
            {
              "path": "wonder3",
              "label": "Last line",
              "type": "text",
              "required": false,
              "maxLength": 18
            }
          ]
        },
        {
          "id": "groom",
          "title": "Groom",
          "scene": "groom",
          "questions": [
            {
              "path": "groomKicker",
              "label": "Word above the groom's name",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "groomEn",
              "label": "Groom's name",
              "type": "text",
              "required": true,
              "maxLength": 12
            }
          ]
        },
        {
          "id": "closing",
          "title": "Save the Date",
          "scene": "closing",
          "questions": [
            {
              "path": "std",
              "label": "Script line",
              "type": "text",
              "required": false,
              "maxLength": 18
            },
            {
              "path": "weddingDate",
              "label": "Wedding date",
              "type": "date",
              "required": true,
              "maxLength": 10
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "intro1": "MAPLA VEETLA OKAY!",
      "intro2": "FEBRUARY LA",
      "intro3": "KALYANAM",
      "intro4": "PONNUKU VETKAM",
      "brideKicker": "BRIDE",
      "brideEn": "",
      "wonder1": "EPPADI IRUPPANO",
      "wonder2": "ENAKKU VARAPORA",
      "wonder3": "PURUSHAN",
      "groomKicker": "GROOM",
      "groomEn": "",
      "std": "Save the Date",
      "weddingDate": "",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "intro1": "MAPLA VEETLA OKAY!",
      "intro2": "FEBRUARY LA",
      "intro3": "KALYANAM",
      "intro4": "PONNUKU VETKAM",
      "brideKicker": "BRIDE",
      "brideEn": "Meera",
      "wonder1": "EPPADI IRUPPANO",
      "wonder2": "ENAKKU VARAPORA",
      "wonder3": "PURUSHAN",
      "groomKicker": "GROOM",
      "groomEn": "Arjun",
      "std": "Save the Date",
      "weddingDate": "2027-02-15",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "opening",
      "intro1": "opening",
      "intro2": "opening",
      "intro3": "opening",
      "intro4": "opening",
      "brideKicker": "bride",
      "brideEn": "bride",
      "wonder1": "swing",
      "wonder2": "swing",
      "wonder3": "swing",
      "groomKicker": "groom",
      "groomEn": "groom",
      "photoBrideId": "bride",
      "photoBrideBox": "bride",
      "photoGroomId": "groom",
      "photoGroomBox": "groom",
      "photoSwingId": "swing",
      "photoSwingBox": "swing",
      "std": "closing",
      "weddingDate": "closing"
    },
    "photoSlots": [
      {
        "slot": "bride",
        "label": "Bride",
        "field": "photoBrideId",
        "box": "photoBrideBox",
        "scene": "bride"
      },
      {
        "slot": "groom",
        "label": "Groom",
        "field": "photoGroomId",
        "box": "photoGroomBox",
        "scene": "groom"
      },
      {
        "slot": "swing",
        "label": "Swing",
        "field": "photoSwingId",
        "box": "photoSwingBox",
        "scene": "swing"
      }
    ],
    "duration": 34.48,
    "kind": "page"
  },
  {
    "id": "film-rajakumari-v1",
    "design": "rajakumari",
    "name": "Rajakumari",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "rajakumari-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Rajakumari Classic"
              }
            },
            {
              "path": "ageNum",
              "label": "Age",
              "type": "text",
              "required": true,
              "maxLength": 2
            },
            {
              "path": "lead",
              "label": "Line under the title",
              "type": "text",
              "required": false,
              "maxLength": 32
            }
          ]
        },
        {
          "id": "photo",
          "title": "Photo & name",
          "scene": "photo",
          "questions": [
            {
              "path": "childName",
              "label": "Child's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "invite",
              "label": "Line on the ribbon",
              "type": "text",
              "required": false,
              "maxLength": 34
            },
            {
              "path": "occasion",
              "label": "Word under the age",
              "type": "text",
              "required": false,
              "maxLength": 14
            }
          ]
        },
        {
          "id": "details",
          "title": "Date & venue",
          "scene": "details",
          "questions": [
            {
              "path": "banner",
              "label": "Ribbon over the date",
              "type": "text",
              "required": false,
              "maxLength": 28
            },
            {
              "path": "partyDate",
              "label": "Party date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "timeFrom",
              "label": "Time From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "timeTo",
              "label": "Time To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "venue1",
              "label": "Venue, line 1",
              "type": "text",
              "required": true,
              "maxLength": 30
            },
            {
              "path": "venue2",
              "label": "Line 2 (optional)",
              "type": "text",
              "required": false,
              "maxLength": 30
            },
            {
              "path": "venue3",
              "label": "Line 3 (optional)",
              "type": "text",
              "required": false,
              "maxLength": 30
            }
          ]
        },
        {
          "id": "closing",
          "title": "R.S.V.P.",
          "scene": "closing",
          "questions": [
            {
              "path": "closing1",
              "label": "Closing, line 1",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "closing2",
              "label": "Closing, line 2",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "rsvpLabel",
              "label": "Heading",
              "type": "text",
              "required": false,
              "maxLength": 14
            },
            {
              "path": "rsvp1",
              "label": "Line 1 (optional)",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "rsvp2",
              "label": "Line 2 (optional)",
              "type": "text",
              "required": false,
              "maxLength": 36
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "childName": "",
      "ageNum": "1",
      "lead": "a little princess turned",
      "invite": "Please join us to celebrate",
      "occasion": "Birthday",
      "banner": "A Day in the Kingdom",
      "partyDate": "",
      "timeFrom": "",
      "timeTo": "",
      "venue1": "",
      "venue2": "",
      "venue3": "",
      "closing1": "Hope to see",
      "closing2": "you there!",
      "rsvpLabel": "R.S.V.P.",
      "rsvp1": "",
      "rsvp2": "",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "childName": "Aadhya",
      "ageNum": "1",
      "lead": "a little princess turned",
      "invite": "Please join us to celebrate",
      "occasion": "Birthday",
      "banner": "A Day in the Kingdom",
      "partyDate": "2027-02-21",
      "timeFrom": "16:00",
      "timeTo": "19:00",
      "venue1": "Hotel Green Park,",
      "venue2": "Vadapalani, Chennai",
      "venue3": "",
      "closing1": "Hope to see",
      "closing2": "you there!",
      "rsvpLabel": "R.S.V.P.",
      "rsvp1": "Priya & Karthik",
      "rsvp2": "+91 98765 43210",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "ageNum": "title",
      "lead": "title",
      "childName": "photo",
      "invite": "photo",
      "occasion": "photo",
      "photoId": "photo",
      "photoBox": "photo",
      "banner": "details",
      "partyDate": "details",
      "timeFrom": "details",
      "timeTo": "details",
      "venue1": "details",
      "venue2": "details",
      "venue3": "details",
      "closing1": "closing",
      "closing2": "closing",
      "rsvpLabel": "closing",
      "rsvp1": "closing",
      "rsvp2": "closing"
    },
    "photoSlots": [
      {
        "slot": "child",
        "label": "Child’s photo",
        "field": "photoId",
        "box": "photoBox",
        "scene": "photo"
      }
    ],
    "duration": 30,
    "kind": "page"
  },
  {
    "id": "film-rajakumaran-v1",
    "design": "rajakumaran",
    "name": "Rajakumaran",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "rajakumaran-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Rajakumaran Classic"
              }
            },
            {
              "path": "ageNum",
              "label": "Age",
              "type": "text",
              "required": true,
              "maxLength": 2
            },
            {
              "path": "lead",
              "label": "Line under the title",
              "type": "text",
              "required": false,
              "maxLength": 32
            }
          ]
        },
        {
          "id": "photo",
          "title": "Photo & name",
          "scene": "photo",
          "questions": [
            {
              "path": "childName",
              "label": "Child's name",
              "type": "text",
              "required": true,
              "maxLength": 20
            },
            {
              "path": "invite",
              "label": "Line on the ribbon",
              "type": "text",
              "required": false,
              "maxLength": 34
            },
            {
              "path": "occasion",
              "label": "Word under the age",
              "type": "text",
              "required": false,
              "maxLength": 14
            }
          ]
        },
        {
          "id": "details",
          "title": "Date & venue",
          "scene": "details",
          "questions": [
            {
              "path": "banner",
              "label": "Ribbon over the date",
              "type": "text",
              "required": false,
              "maxLength": 28
            },
            {
              "path": "partyDate",
              "label": "Party date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "timeFrom",
              "label": "Time From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "timeTo",
              "label": "Time To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "venue1",
              "label": "Venue, line 1",
              "type": "text",
              "required": true,
              "maxLength": 30
            },
            {
              "path": "venue2",
              "label": "Line 2 (optional)",
              "type": "text",
              "required": false,
              "maxLength": 30
            },
            {
              "path": "venue3",
              "label": "Line 3 (optional)",
              "type": "text",
              "required": false,
              "maxLength": 30
            }
          ]
        },
        {
          "id": "closing",
          "title": "R.S.V.P.",
          "scene": "closing",
          "questions": [
            {
              "path": "closing1",
              "label": "Closing, line 1",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "closing2",
              "label": "Closing, line 2",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "rsvpLabel",
              "label": "Heading",
              "type": "text",
              "required": false,
              "maxLength": 14
            },
            {
              "path": "rsvp1",
              "label": "Line 1 (optional)",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "rsvp2",
              "label": "Line 2 (optional)",
              "type": "text",
              "required": false,
              "maxLength": 36
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "childName": "",
      "ageNum": "1",
      "lead": "a little prince turned",
      "invite": "Please join us to celebrate",
      "occasion": "Birthday",
      "banner": "A Day in the Kingdom",
      "partyDate": "",
      "timeFrom": "",
      "timeTo": "",
      "venue1": "",
      "venue2": "",
      "venue3": "",
      "closing1": "Hope to see",
      "closing2": "you there!",
      "rsvpLabel": "R.S.V.P.",
      "rsvp1": "",
      "rsvp2": "",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "childName": "Aarav",
      "ageNum": "1",
      "lead": "a little prince turned",
      "invite": "Please join us to celebrate",
      "occasion": "Birthday",
      "banner": "A Day in the Kingdom",
      "partyDate": "2027-02-21",
      "timeFrom": "16:00",
      "timeTo": "19:00",
      "venue1": "Hotel Green Park,",
      "venue2": "Vadapalani, Chennai",
      "venue3": "",
      "closing1": "Hope to see",
      "closing2": "you there!",
      "rsvpLabel": "R.S.V.P.",
      "rsvp1": "Priya & Karthik",
      "rsvp2": "+91 98765 43210",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "ageNum": "title",
      "lead": "title",
      "childName": "photo",
      "invite": "photo",
      "occasion": "photo",
      "photoId": "photo",
      "photoBox": "photo",
      "banner": "details",
      "partyDate": "details",
      "timeFrom": "details",
      "timeTo": "details",
      "venue1": "details",
      "venue2": "details",
      "venue3": "details",
      "closing1": "closing",
      "closing2": "closing",
      "rsvpLabel": "closing",
      "rsvp1": "closing",
      "rsvp2": "closing"
    },
    "photoSlots": [
      {
        "slot": "child",
        "label": "Child’s photo",
        "field": "photoId",
        "box": "photoBox",
        "scene": "photo"
      }
    ],
    "duration": 30,
    "kind": "page"
  },
  {
    "id": "film-ilavarasi-v1",
    "design": "ilavarasi",
    "name": "Kutti Ilavarasi",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "ilavarasi-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "title",
          "title": "Title",
          "scene": "title",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic"
              ],
              "optionLabels": {
                "classic": "Kutti Ilavarasi Classic"
              }
            },
            {
              "path": "name1",
              "label": "Child's name",
              "type": "text",
              "required": true,
              "maxLength": 12
            },
            {
              "path": "name2",
              "label": "Second line of the name (optional)",
              "type": "text",
              "required": false,
              "maxLength": 12
            },
            {
              "path": "ageNum",
              "label": "Age she is turning",
              "type": "text",
              "required": true,
              "maxLength": 2
            }
          ]
        },
        {
          "id": "story",
          "title": "Once upon a time",
          "scene": "story",
          "questions": [
            {
              "path": "storyTitle",
              "label": "Title",
              "type": "text",
              "required": false,
              "maxLength": 26
            },
            {
              "path": "story1",
              "label": "Line 1",
              "type": "text",
              "required": false,
              "maxLength": 34
            },
            {
              "path": "story2",
              "label": "Line 2",
              "type": "text",
              "required": false,
              "maxLength": 34
            },
            {
              "path": "story3",
              "label": "Line 3",
              "type": "text",
              "required": false,
              "maxLength": 34
            }
          ]
        },
        {
          "id": "invite",
          "title": "Invitation",
          "scene": "invite",
          "questions": [
            {
              "path": "invited",
              "label": "First line",
              "type": "text",
              "required": false,
              "maxLength": 28
            },
            {
              "path": "royal",
              "label": "Second line",
              "type": "text",
              "required": false,
              "maxLength": 30
            },
            {
              "path": "honor",
              "label": "Third line",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "princess",
              "label": "Word before the name",
              "type": "text",
              "required": false,
              "maxLength": 18
            }
          ]
        },
        {
          "id": "details",
          "title": "Date & venue",
          "scene": "details",
          "questions": [
            {
              "path": "ribbon",
              "label": "Words on the palace ribbon",
              "type": "text",
              "required": false,
              "maxLength": 26
            },
            {
              "path": "partyDate",
              "label": "Party date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "timeFrom",
              "label": "Time From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "timeTo",
              "label": "Time To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "venue",
              "label": "Venue name",
              "type": "text",
              "required": true,
              "maxLength": 32
            },
            {
              "path": "landmark",
              "label": "Landmark (optional)",
              "type": "text",
              "required": false,
              "maxLength": 36
            },
            {
              "path": "address1",
              "label": "Address",
              "type": "text",
              "required": true,
              "maxLength": 46
            },
            {
              "path": "address2",
              "label": "Address, line 2 (optional)",
              "type": "text",
              "required": false,
              "maxLength": 46
            }
          ]
        },
        {
          "id": "rsvp",
          "title": "RSVP",
          "scene": "rsvp",
          "questions": [
            {
              "path": "rsvpLabel",
              "label": "Heading",
              "type": "text",
              "required": false,
              "maxLength": 16
            },
            {
              "path": "rsvpName",
              "label": "Names",
              "type": "text",
              "required": true,
              "maxLength": 30
            },
            {
              "path": "rsvpPhone",
              "label": "Phone",
              "type": "text",
              "required": true,
              "maxLength": 18
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "name1": "",
      "name2": "",
      "ageNum": "",
      "storyTitle": "Once upon a time",
      "story1": "in a kingdom far away",
      "story2": "we prepare to celebrate",
      "story3": "a very special day",
      "invited": "You are invited",
      "royal": "to a Royal Celebration",
      "honor": "in honour of",
      "princess": "Princess",
      "ribbon": "Hope to see you soon",
      "partyDate": "",
      "timeFrom": "",
      "timeTo": "",
      "venue": "",
      "landmark": "",
      "address1": "",
      "address2": "",
      "rsvpLabel": "RSVP to",
      "rsvpName": "",
      "rsvpPhone": "",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "name1": "Aadhya",
      "name2": "Meera",
      "ageNum": "5",
      "storyTitle": "Once upon a time",
      "story1": "in a kingdom far away",
      "story2": "we prepare to celebrate",
      "story3": "a very special day",
      "invited": "You are invited",
      "royal": "to a Royal Celebration",
      "honor": "in honour of",
      "princess": "Princess",
      "ribbon": "Hope to see you soon",
      "partyDate": "2026-12-12",
      "timeFrom": "16:30",
      "timeTo": "",
      "venue": "Lotus Party Hall",
      "landmark": "Near Tower Park",
      "address1": "12, 3rd Avenue, Anna Nagar",
      "address2": "Chennai 600040",
      "rsvpLabel": "RSVP to",
      "rsvpName": "Priya & Karthik",
      "rsvpPhone": "98400 12345",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "title",
      "name1": "title",
      "name2": "title",
      "ageNum": "title",
      "storyTitle": "story",
      "story1": "story",
      "story2": "story",
      "story3": "story",
      "invited": "invite",
      "royal": "invite",
      "honor": "invite",
      "princess": "invite",
      "ribbon": "details",
      "partyDate": "details",
      "timeFrom": "details",
      "timeTo": "details",
      "venue": "details",
      "landmark": "details",
      "address1": "details",
      "address2": "details",
      "rsvpLabel": "rsvp",
      "rsvpName": "rsvp",
      "rsvpPhone": "rsvp"
    },
    "photoSlots": [],
    "duration": 41.5,
    "kind": "page"
  },
  {
    "id": "film-velicham-v1",
    "design": "velicham",
    "name": "Puthu Velicham",
    "collection": "INVITATION VIDEOS",
    "description": "Make every scene your own.",
    "filename": "velicham-invitation.mp4",
    "form": {
      "version": 1,
      "title": "Personalise your invitation",
      "steps": [
        {
          "id": "opening",
          "title": "Gate",
          "scene": "opening",
          "questions": [
            {
              "path": "fontSet",
              "label": "Font Set",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "classic",
                "royal",
                "graceful",
                "modern",
                "festive"
              ],
              "optionLabels": {
                "classic": "Velicham Classic",
                "royal": "Royal Serif",
                "graceful": "Graceful Script",
                "modern": "Modern Minimal",
                "festive": "Festive"
              }
            },
            {
              "path": "sizeOpening",
              "label": "Size Opening",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            },
            {
              "path": "occasion",
              "label": "Title (script)",
              "type": "text",
              "required": false,
              "maxLength": 24
            },
            {
              "path": "family",
              "label": "Family name",
              "type": "text",
              "required": true,
              "maxLength": 36
            }
          ]
        },
        {
          "id": "kolam",
          "title": "Kolam",
          "scene": "kolam",
          "questions": []
        },
        {
          "id": "invitation",
          "title": "Doorway",
          "scene": "invitation",
          "questions": [
            {
              "path": "sizeInvitation",
              "label": "Size Invitation",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            },
            {
              "path": "blessing",
              "label": "Blessing",
              "type": "textarea",
              "required": false,
              "maxLength": 72
            },
            {
              "path": "hosts",
              "label": "Invited by (script) (optional)",
              "type": "text",
              "required": false,
              "maxLength": 44
            },
            {
              "path": "invite",
              "label": "Invitation",
              "type": "textarea",
              "required": false,
              "maxLength": 76
            }
          ]
        },
        {
          "id": "muhurtham",
          "title": "Muhurtham",
          "scene": "muhurtham",
          "questions": [
            {
              "path": "sizeMuhurtham",
              "label": "Size Muhurtham",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            },
            {
              "path": "eventDate",
              "label": "Date",
              "type": "date",
              "required": true,
              "maxLength": 10
            },
            {
              "path": "muhurthamFrom",
              "label": "Muhurtham From",
              "type": "time",
              "required": true,
              "maxLength": 5
            },
            {
              "path": "muhurthamTo",
              "label": "Muhurtham To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "extra1",
              "label": "Line 1",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "extra1Day",
              "label": "Day",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "extra1From",
              "label": "Extra1From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "extra1To",
              "label": "Extra1To",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "extra2",
              "label": "Line 2",
              "type": "text",
              "required": false,
              "maxLength": 120
            },
            {
              "path": "extra2Day",
              "label": "Day",
              "type": "date",
              "required": false,
              "maxLength": 10
            },
            {
              "path": "extra2From",
              "label": "Extra2From",
              "type": "time",
              "required": false,
              "maxLength": 5
            },
            {
              "path": "extra2To",
              "label": "Extra2To",
              "type": "time",
              "required": false,
              "maxLength": 5
            }
          ]
        },
        {
          "id": "welcome",
          "title": "Welcome",
          "scene": "welcome",
          "questions": [
            {
              "path": "sizeWelcome",
              "label": "Size Welcome",
              "type": "select",
              "required": false,
              "maxLength": 120,
              "options": [
                "80",
                "85",
                "90",
                "95",
                "100",
                "105",
                "110"
              ],
              "optionLabels": {
                "80": "80",
                "85": "85",
                "90": "90",
                "95": "95",
                "100": "100",
                "105": "105",
                "110": "110"
              }
            },
            {
              "path": "house",
              "label": "House name (script) (optional)",
              "type": "text",
              "required": false,
              "maxLength": 32
            },
            {
              "path": "address1",
              "label": "Address, first line",
              "type": "text",
              "required": true,
              "maxLength": 64
            },
            {
              "path": "address2",
              "label": "Address, second line (optional)",
              "type": "text",
              "required": false,
              "maxLength": 48
            },
            {
              "path": "thanks",
              "label": "Thank-you line",
              "type": "text",
              "required": false,
              "maxLength": 56
            }
          ]
        },
        {
          "id": "music",
          "title": "Music",
          "questions": []
        },
        {
          "id": "review",
          "title": "Review & download",
          "questions": []
        }
      ]
    },
    "defaults": {
      "fontSet": "classic",
      "sizeOpening": "100",
      "sizeInvitation": "100",
      "sizeMuhurtham": "100",
      "sizeWelcome": "100",
      "occasion": "Housewarming",
      "family": "",
      "eventDate": "",
      "muhurthamFrom": "",
      "muhurthamTo": "",
      "blessing": "With the blessings of Lord Ganesha and our elders",
      "hosts": "",
      "invite": "warmly invite you to bless our new home",
      "extra1": "",
      "extra1Day": "",
      "extra1From": "",
      "extra1To": "",
      "extra2": "",
      "extra2Day": "",
      "extra2From": "",
      "extra2To": "",
      "house": "",
      "address1": "",
      "address2": "",
      "thanks": "Your presence is our blessing",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "example": {
      "fontSet": "classic",
      "sizeOpening": "100",
      "sizeInvitation": "100",
      "sizeMuhurtham": "100",
      "sizeWelcome": "100",
      "occasion": "Housewarming",
      "family": "Raghavan",
      "eventDate": "2027-02-14",
      "muhurthamFrom": "06:00",
      "muhurthamTo": "07:30",
      "blessing": "With the blessings of Lord Ganesha and our elders",
      "hosts": "Suresh & Meena",
      "invite": "warmly invite you to bless our new home",
      "extra1": "",
      "extra1Day": "",
      "extra1From": "",
      "extra1To": "",
      "extra2": "",
      "extra2Day": "",
      "extra2From": "",
      "extra2To": "",
      "house": "Anbu Illam",
      "address1": "12, Gandhi Nagar",
      "address2": "Coimbatore 641 012",
      "thanks": "Your presence is our blessing",
      "photos": {},
      "music": {
        "mode": "none"
      }
    },
    "fieldScene": {
      "fontSet": "opening",
      "sizeOpening": "opening",
      "occasion": "opening",
      "family": "opening",
      "sizeInvitation": "invitation",
      "blessing": "invitation",
      "hosts": "invitation",
      "invite": "invitation",
      "sizeMuhurtham": "muhurtham",
      "eventDate": "muhurtham",
      "muhurthamFrom": "muhurtham",
      "muhurthamTo": "muhurtham",
      "extra1": "muhurtham",
      "extra1Day": "muhurtham",
      "extra1From": "muhurtham",
      "extra1To": "muhurtham",
      "extra2": "muhurtham",
      "extra2Day": "muhurtham",
      "extra2From": "muhurtham",
      "extra2To": "muhurtham",
      "sizeWelcome": "welcome",
      "house": "welcome",
      "address1": "welcome",
      "address2": "welcome",
      "thanks": "welcome"
    },
    "photoSlots": [],
    "duration": 38.8,
    "kind": "page"
  }
];
export const catalogVideo = id => VIDEO_CATALOG.find(entry => entry.id === id);
