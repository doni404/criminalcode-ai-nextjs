// Sample Crime Name Master Data
// This demonstrates the structure for criminal law database entries

export const sampleCrimeNameMaster = [
  {
    name: "Robbery",
    articleNumber: 236,
    constituentElements: [
      "Violence or threat of violence against person",
      "Taking of movable property belonging to another",
      "Intent to permanently deprive owner",
      "Taking from victim's immediate presence or vicinity",
      "Against the victim's will"
    ],
    definitions: "The forcible taking of property from a person through violence or intimidation",
    relatedTerms: [
      "forcible taking", "violence", "intimidation", "immediate presence", 
      "movable property", "intent to deprive", "theft", "assault"
    ],
    penalty: "Imprisonment with forced labor for not less than 3 years",
    chapter: "Crimes Against Property",
    severity: "felony",
    subcategory: "violent property crime"
  },
  
  {
    name: "Theft",
    articleNumber: 235,
    constituentElements: [
      "Taking of movable property",
      "Property belonging to another person",
      "Intent to permanently deprive owner",
      "Without owner's consent",
      "Unlawful appropriation"
    ],
    definitions: "The unlawful taking of movable property belonging to another with intent to permanently deprive",
    relatedTerms: [
      "larceny", "taking", "movable property", "appropriation", 
      "intent to deprive", "without consent", "unlawful"
    ],
    penalty: "Imprisonment with forced labor for not more than 10 years or fine not exceeding 500,000 yen",
    chapter: "Crimes Against Property",
    severity: "felony",
    subcategory: "property crime"
  },

  {
    name: "Assault",
    articleNumber: 204,
    constituentElements: [
      "Intentional infliction of bodily harm",
      "On another person",
      "Without legal justification",
      "With intent to cause harm",
      "Actual physical injury"
    ],
    definitions: "The intentional infliction of bodily harm upon another person",
    relatedTerms: [
      "bodily harm", "physical injury", "intentional conduct", 
      "battery", "violence", "harm", "injury"
    ],
    penalty: "Imprisonment for not more than 15 years or fine not exceeding 500,000 yen",
    chapter: "Crimes Against Persons",
    severity: "felony",
    subcategory: "violent crime"
  },

  {
    name: "Threat",
    articleNumber: 222,
    constituentElements: [
      "Communication of threat",
      "Threat of harm to life, body, liberty, reputation, or property",
      "Intent to intimidate",
      "Reasonable fear in victim",
      "Credible and immediate threat"
    ],
    definitions: "The communication of a threat to harm another person's life, body, liberty, reputation, or property",
    relatedTerms: [
      "intimidation", "threatening", "fear", "menace", 
      "coercion", "verbal assault", "harassment"
    ],
    penalty: "Imprisonment for not more than 2 years or fine not exceeding 300,000 yen",
    chapter: "Crimes Against Persons",
    severity: "misdemeanor",
    subcategory: "threat crime"
  },

  {
    name: "Fraud",
    articleNumber: 246,
    constituentElements: [
      "Deceptive conduct or false representation",
      "Intent to deceive",
      "Victim's reliance on false information",
      "Transfer of property or advantage",
      "Economic loss to victim"
    ],
    definitions: "The intentional deception of another person to obtain property or economic advantage",
    relatedTerms: [
      "deception", "false representation", "misrepresentation", 
      "economic crime", "swindle", "embezzlement", "confidence trick"
    ],
    penalty: "Imprisonment with forced labor for not more than 10 years",
    chapter: "Crimes Against Property",
    severity: "felony",
    subcategory: "economic crime"
  },

  {
    name: "Embezzlement",
    articleNumber: 252,
    constituentElements: [
      "Lawful possession of property",
      "Property belonging to another",
      "Conversion for personal use",
      "Intent to permanently deprive",
      "Breach of trust or fiduciary duty"
    ],
    definitions: "The unlawful appropriation of property lawfully in one's possession for personal use",
    relatedTerms: [
      "misappropriation", "breach of trust", "fiduciary duty", 
      "conversion", "unlawful appropriation", "white collar crime"
    ],
    penalty: "Imprisonment with forced labor for not more than 5 years or fine not exceeding 500,000 yen",
    chapter: "Crimes Against Property",
    severity: "felony",
    subcategory: "white collar crime"
  },

  {
    name: "Burglary",
    articleNumber: 130,
    constituentElements: [
      "Unlawful entry into building or structure",
      "Breaking and entering",
      "Intent to commit crime inside",
      "Entry without permission",
      "Criminal purpose"
    ],
    definitions: "The unlawful entry into a building or structure with intent to commit a crime",
    relatedTerms: [
      "breaking and entering", "trespass", "unlawful entry", 
      "building", "structure", "criminal intent"
    ],
    penalty: "Imprisonment with forced labor for not more than 10 years",
    chapter: "Crimes Against Property",
    severity: "felony",
    subcategory: "property crime"
  },

  {
    name: "Extortion",
    articleNumber: 249,
    constituentElements: [
      "Threat or intimidation",
      "Demand for property or advantage",
      "Use of force or fear",
      "Intent to obtain property",
      "Victim's compliance under duress"
    ],
    definitions: "The obtaining of property or advantage through threats, intimidation, or coercion",
    relatedTerms: [
      "blackmail", "coercion", "intimidation", "threats", 
      "duress", "extortionate demands", "racketeering"
    ],
    penalty: "Imprisonment with forced labor for not more than 10 years",
    chapter: "Crimes Against Property",
    severity: "felony",
    subcategory: "violent property crime"
  },

  {
    name: "Negligent Injury",
    articleNumber: 209,
    constituentElements: [
      "Negligent conduct",
      "Breach of duty of care",
      "Causation of bodily injury",
      "Foreseeability of harm",
      "Lack of criminal intent"
    ],
    definitions: "The causing of bodily injury to another through negligent conduct",
    relatedTerms: [
      "negligence", "breach of duty", "unintentional harm", 
      "accident", "carelessness", "injury", "civil liability"
    ],
    penalty: "Imprisonment for not more than 30 days or fine not exceeding 10,000 yen",
    chapter: "Crimes Against Persons",
    severity: "misdemeanor",
    subcategory: "negligent crime"
  },

  {
    name: "Vandalism",
    articleNumber: 261,
    constituentElements: [
      "Destruction or damage to property",
      "Property belonging to another",
      "Intentional conduct",
      "Without owner's consent",
      "Diminishment of property value"
    ],
    definitions: "The intentional destruction or damage of property belonging to another",
    relatedTerms: [
      "property damage", "destruction", "defacement", 
      "mischief", "criminal damage", "graffiti"
    ],
    penalty: "Imprisonment for not more than 3 years or fine not exceeding 300,000 yen",
    chapter: "Crimes Against Property",
    severity: "misdemeanor",
    subcategory: "property crime"
  }
];

export default sampleCrimeNameMaster; 