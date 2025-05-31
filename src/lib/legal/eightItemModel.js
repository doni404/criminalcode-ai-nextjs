class EightItemModel {
  constructor() {
    this.items = [
      {
        id: 'who',
        question: 'Who (subject of the crime)',
        description: 'Identify the person(s) who committed or are alleged to have committed the criminal act.',
        examples: ['Individual adult', 'Minor', 'Corporate entity', 'Government official', 'Multiple defendants'],
        required: true,
        followUpQuestions: [
          'What is the age of the subject?',
          'Are they a repeat offender?',
          'Do they hold any special legal status?'
        ]
      },
      {
        id: 'withWhom',
        question: 'With whom (accomplice)',
        description: 'Identify any accomplices, conspirators, or co-defendants involved in the criminal act.',
        examples: ['No accomplices', 'Co-conspirator', 'Accessory before the fact', 'Accessory after the fact'],
        required: false,
        followUpQuestions: [
          'What was their role in the crime?',
          'Did they act as leaders or followers?',
          'Were they aware of the criminal intent?'
        ]
      },
      {
        id: 'why',
        question: 'Why (motive or purpose of the crime)',
        description: 'Determine the motive, intent, or purpose behind the criminal act.',
        examples: ['Financial gain', 'Revenge', 'Self-defense', 'Mental illness', 'Coercion', 'Ideological'],
        required: true,
        followUpQuestions: [
          'Was the motive premeditated?',
          'Was there criminal intent (mens rea)?',
          'Were there mitigating circumstances?'
        ]
      },
      {
        id: 'when',
        question: 'When (date and time of the crime)',
        description: 'Establish the specific time frame when the criminal act occurred.',
        examples: ['Exact date and time', 'Time period', 'During business hours', 'At night', 'During emergency'],
        required: true,
        followUpQuestions: [
          'Is there a statute of limitations issue?',
          'Were there temporal aggravating factors?',
          'Can the timeline be verified?'
        ]
      },
      {
        id: 'where',
        question: 'Where (location of the crime)',
        description: 'Identify the specific location or jurisdiction where the criminal act took place.',
        examples: ['Private property', 'Public space', 'Online/cyber space', 'Multiple jurisdictions', 'International'],
        required: true,
        followUpQuestions: [
          'Which jurisdiction has authority?',
          'Were there jurisdictional complications?',
          'Does location affect the crime classification?'
        ]
      },
      {
        id: 'toWhomWhat',
        question: 'To whom, what (target of the crime)',
        description: 'Identify the victim(s) or target of the criminal act, including persons or property.',
        examples: ['Individual victim', 'Corporate victim', 'Government entity', 'Property', 'Public interest'],
        required: true,
        followUpQuestions: [
          'What was the extent of harm?',
          'Was the victim particularly vulnerable?',
          'Are there victim rights considerations?'
        ]
      },
      {
        id: 'how',
        question: 'How (method or means of the crime)',
        description: 'Describe the specific method, tools, or means used to commit the criminal act.',
        examples: ['Physical force', 'Deception', 'Technology', 'Weapons', 'Breach of trust', 'Negligence'],
        required: true,
        followUpQuestions: [
          'Were sophisticated methods used?',
          'Did the method involve special skills?',
          'Were there aggravating factors in the method?'
        ]
      },
      {
        id: 'whatHappened',
        question: 'What was done, what happened (action and result of the crime)',
        description: 'Detail the specific actions taken and their consequences or results.',
        examples: ['Completed crime', 'Attempted crime', 'Inchoate offense', 'Ongoing criminal activity'],
        required: true,
        followUpQuestions: [
          'Was the crime completed successfully?',
          'What were the actual consequences?',
          'Were there unintended results?'
        ]
      }
    ];
  }

  // Get all 8 items
  getAllItems() {
    return this.items;
  }

  // Get a specific item by ID
  getItem(id) {
    return this.items.find(item => item.id === id);
  }

  // Get required items only
  getRequiredItems() {
    return this.items.filter(item => item.required);
  }

  // Validate if all required items are completed
  validateCompletion(responses) {
    const requiredItems = this.getRequiredItems();
    const missing = [];

    for (const item of requiredItems) {
      if (!responses[item.id] || responses[item.id].trim() === '') {
        missing.push(item.question);
      }
    }

    return {
      isComplete: missing.length === 0,
      missingItems: missing,
      completionRate: ((this.items.length - missing.length) / this.items.length) * 100
    };
  }

  // Generate legal analysis prompt based on 8-item responses
  generateLegalAnalysisPrompt(responses) {
    let prompt = `Based on the following criminal case details analyzed through the 8-item framework, provide a comprehensive legal analysis:\n\n`;

    for (const item of this.items) {
      if (responses[item.id]) {
        prompt += `${item.question}: ${responses[item.id]}\n`;
      }
    }

    prompt += `\nPlease provide:\n`;
    prompt += `1. **Potential Criminal Charges**: What specific crimes may have been committed?\n`;
    prompt += `2. **Constituent Elements Analysis**: For each potential charge, analyze if the constituent elements are met.\n`;
    prompt += `3. **Applicable Criminal Code Articles**: Cite specific articles and sections.\n`;
    prompt += `4. **Aggravating/Mitigating Factors**: Identify factors that could affect sentencing.\n`;
    prompt += `5. **Defenses**: What legal defenses might be available?\n`;
    prompt += `6. **Procedural Considerations**: Important procedural or jurisdictional issues.\n`;
    prompt += `7. **Similar Case Law**: Reference to relevant precedents if applicable.\n`;
    prompt += `8. **Recommended Next Steps**: What should be done next in this case?\n\n`;
    prompt += `Please structure your response with clear headings and provide specific legal reasoning.`;

    return prompt;
  }

  // Extract key legal concepts from responses
  extractLegalConcepts(responses) {
    const concepts = {
      crimeTypes: [],
      legalElements: [],
      aggravatingFactors: [],
      mitigatingFactors: [],
      jurisdictionalIssues: []
    };

    // Analyze WHO responses for legal status
    if (responses.who) {
      if (responses.who.toLowerCase().includes('minor')) {
        concepts.legalElements.push('juvenile_defendant');
      }
      if (responses.who.toLowerCase().includes('repeat')) {
        concepts.aggravatingFactors.push('repeat_offender');
      }
    }

    // Analyze WITH WHOM for conspiracy
    if (responses.withWhom && responses.withWhom.toLowerCase() !== 'no accomplices') {
      concepts.crimeTypes.push('conspiracy');
      concepts.legalElements.push('multiple_defendants');
    }

    // Analyze WHY for mens rea
    if (responses.why) {
      const motive = responses.why.toLowerCase();
      if (motive.includes('premeditated') || motive.includes('planned')) {
        concepts.aggravatingFactors.push('premeditation');
      }
      if (motive.includes('self-defense')) {
        concepts.mitigatingFactors.push('self_defense');
      }
      if (motive.includes('mental illness')) {
        concepts.mitigatingFactors.push('mental_health');
      }
    }

    // Analyze WHERE for jurisdiction
    if (responses.where) {
      const location = responses.where.toLowerCase();
      if (location.includes('online') || location.includes('cyber')) {
        concepts.jurisdictionalIssues.push('cyber_crime');
      }
      if (location.includes('multiple') || location.includes('cross')) {
        concepts.jurisdictionalIssues.push('multiple_jurisdictions');
      }
    }

    // Analyze HOW for crime classification
    if (responses.how) {
      const method = responses.how.toLowerCase();
      if (method.includes('weapon')) {
        concepts.aggravatingFactors.push('weapon_use');
      }
      if (method.includes('force') || method.includes('violence')) {
        concepts.crimeTypes.push('violent_crime');
      }
      if (method.includes('deception') || method.includes('fraud')) {
        concepts.crimeTypes.push('fraud');
      }
    }

    return concepts;
  }

  // Generate search vectors for master database queries
  generateSearchContext(responses) {
    const searchTerms = [];
    
    // Extract key terms from each response
    for (const [key, value] of Object.entries(responses)) {
      if (value && typeof value === 'string') {
        // Clean and extract meaningful terms
        const terms = value.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(term => term.length > 3)
          .filter(term => !['the', 'and', 'or', 'but', 'with', 'was', 'were', 'been', 'have', 'has'].includes(term));
        
        searchTerms.push(...terms);
      }
    }

    // Remove duplicates and create search context
    const uniqueTerms = [...new Set(searchTerms)];
    
    return {
      searchText: uniqueTerms.join(' '),
      keyTerms: uniqueTerms,
      context: this.extractLegalConcepts(responses)
    };
  }

  // Score the quality/completeness of responses
  scoreResponses(responses) {
    let totalScore = 0;
    const itemScores = {};

    for (const item of this.items) {
      const response = responses[item.id];
      let score = 0;

      if (response && response.trim() !== '') {
        // Base score for having a response
        score = 3;

        // Bonus points for detailed responses
        if (response.length > 50) score += 1;
        if (response.length > 100) score += 1;

        // Bonus for required fields
        if (item.required) score += 1;

        // Check for legal keywords
        const legalKeywords = ['article', 'section', 'law', 'crime', 'offense', 'defendant', 'victim'];
        const hasLegalTerms = legalKeywords.some(keyword => 
          response.toLowerCase().includes(keyword)
        );
        if (hasLegalTerms) score += 1;
      }

      itemScores[item.id] = score;
      totalScore += score;
    }

    const maxPossibleScore = this.items.length * 7; // Maximum 7 points per item
    const percentage = (totalScore / maxPossibleScore) * 100;

    return {
      totalScore,
      maxPossibleScore,
      percentage: Math.round(percentage),
      itemScores,
      quality: percentage >= 80 ? 'excellent' : 
               percentage >= 60 ? 'good' : 
               percentage >= 40 ? 'fair' : 'poor'
    };
  }
}

export default EightItemModel; 