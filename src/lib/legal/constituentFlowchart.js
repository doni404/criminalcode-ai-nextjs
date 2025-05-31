class ConstituentElementFlowchart {
  constructor() {
    // Define common crime flowcharts
    this.flowcharts = {
      robbery: {
        name: 'Robbery Analysis',
        description: 'Flowchart to determine if robbery constituent elements are met',
        startNode: 'violence_check',
        nodes: {
          violence_check: {
            question: 'Was there violence or threat of violence?',
            description: 'Robbery requires force or intimidation',
            yesNext: 'property_taking',
            noNext: 'not_robbery_violence',
            legalElement: 'violence_or_threat'
          },
          property_taking: {
            question: 'Was property taken from the victim?',
            description: 'There must be actual taking of property',
            yesNext: 'intent_check',
            noNext: 'attempted_robbery',
            legalElement: 'taking_of_property'
          },
          intent_check: {
            question: 'Was there intent to permanently deprive the victim?',
            description: 'Criminal intent (mens rea) must be present',
            yesNext: 'immediate_presence',
            noNext: 'not_robbery_intent',
            legalElement: 'criminal_intent'
          },
          immediate_presence: {
            question: 'Was the property taken from the victim\'s immediate presence?',
            description: 'Robbery requires taking from person or immediate vicinity',
            yesNext: 'robbery_established',
            noNext: 'possible_theft',
            legalElement: 'immediate_presence'
          },
          robbery_established: {
            type: 'conclusion',
            result: 'ROBBERY ESTABLISHED',
            confidence: 'high',
            article: 'Article 236',
            penalty: 'Imprisonment with forced labor for not less than 3 years'
          },
          not_robbery_violence: {
            type: 'conclusion',
            result: 'NOT ROBBERY - No violence or threat',
            confidence: 'high',
            alternative: 'Consider theft or other property crimes'
          },
          attempted_robbery: {
            type: 'conclusion',
            result: 'ATTEMPTED ROBBERY',
            confidence: 'medium',
            article: 'Article 236 + Article 43',
            penalty: 'Reduced penalty for attempt'
          },
          not_robbery_intent: {
            type: 'conclusion',
            result: 'NOT ROBBERY - Insufficient intent',
            confidence: 'medium',
            alternative: 'Consider assault or other violent crimes'
          },
          possible_theft: {
            type: 'conclusion',
            result: 'POSSIBLE THEFT',
            confidence: 'medium',
            alternative: 'Analyze under theft provisions (Article 235)'
          }
        }
      },
      
      theft: {
        name: 'Theft Analysis',
        description: 'Flowchart to determine if theft constituent elements are met',
        startNode: 'property_taking_theft',
        nodes: {
          property_taking_theft: {
            question: 'Was movable property taken from another person?',
            description: 'Theft requires taking of movable property belonging to another',
            yesNext: 'intent_permanent',
            noNext: 'not_theft_property',
            legalElement: 'movable_property_of_another'
          },
          intent_permanent: {
            question: 'Was there intent to permanently deprive the owner?',
            description: 'Theftuous intent must be present',
            yesNext: 'unlawful_taking',
            noNext: 'not_theft_intent',
            legalElement: 'theftuous_intent'
          },
          unlawful_taking: {
            question: 'Was the taking done without the owner\'s consent?',
            description: 'Taking must be unlawful',
            yesNext: 'theft_established',
            noNext: 'not_theft_consent',
            legalElement: 'without_consent'
          },
          theft_established: {
            type: 'conclusion',
            result: 'THEFT ESTABLISHED',
            confidence: 'high',
            article: 'Article 235',
            penalty: 'Imprisonment with forced labor for not more than 10 years or fine'
          },
          not_theft_property: {
            type: 'conclusion',
            result: 'NOT THEFT - Property requirement not met',
            confidence: 'high',
            alternative: 'Consider other property crimes or civil matters'
          },
          not_theft_intent: {
            type: 'conclusion',
            result: 'NOT THEFT - Insufficient intent',
            confidence: 'medium',
            alternative: 'Consider temporary use or civil conversion'
          },
          not_theft_consent: {
            type: 'conclusion',
            result: 'NOT THEFT - Owner consented',
            confidence: 'high',
            alternative: 'No criminal liability for consensual taking'
          }
        }
      },

      assault: {
        name: 'Assault Analysis',
        description: 'Flowchart to determine if assault constituent elements are met',
        startNode: 'bodily_harm',
        nodes: {
          bodily_harm: {
            question: 'Was bodily harm inflicted on another person?',
            description: 'Physical injury must have occurred',
            yesNext: 'intentional_harm',
            noNext: 'check_threat',
            legalElement: 'bodily_harm'
          },
          intentional_harm: {
            question: 'Was the harm inflicted intentionally?',
            description: 'Intent to cause harm must be present',
            yesNext: 'unlawful_harm',
            noNext: 'negligent_harm',
            legalElement: 'intentional_conduct'
          },
          unlawful_harm: {
            question: 'Was the harm inflicted unlawfully (no legal justification)?',
            description: 'No self-defense, defense of others, or other legal justification',
            yesNext: 'assault_established',
            noNext: 'justified_harm',
            legalElement: 'unlawfulness'
          },
          check_threat: {
            question: 'Was there a threat of immediate bodily harm?',
            description: 'Assault can include threat of violence',
            yesNext: 'credible_threat',
            noNext: 'no_assault',
            legalElement: 'threat_of_harm'
          },
          credible_threat: {
            question: 'Was the threat credible and immediate?',
            description: 'Victim must reasonably fear immediate harm',
            yesNext: 'assault_threat_established',
            noNext: 'no_assault',
            legalElement: 'credible_immediate_threat'
          },
          assault_established: {
            type: 'conclusion',
            result: 'ASSAULT (BODILY HARM) ESTABLISHED',
            confidence: 'high',
            article: 'Article 204',
            penalty: 'Imprisonment for not more than 15 years or fine'
          },
          assault_threat_established: {
            type: 'conclusion',
            result: 'ASSAULT (THREAT) ESTABLISHED',
            confidence: 'medium',
            article: 'Article 222',
            penalty: 'Imprisonment for not more than 2 years or fine'
          },
          negligent_harm: {
            type: 'conclusion',
            result: 'NEGLIGENT BODILY HARM',
            confidence: 'medium',
            article: 'Article 209',
            alternative: 'Consider negligent injury charges'
          },
          justified_harm: {
            type: 'conclusion',
            result: 'JUSTIFIED HARM - No criminal liability',
            confidence: 'high',
            alternative: 'Self-defense or other legal justification applies'
          },
          no_assault: {
            type: 'conclusion',
            result: 'NO ASSAULT',
            confidence: 'high',
            alternative: 'Consider other offenses or civil remedies'
          }
        }
      }
    };
  }

  // Get available flowcharts
  getAvailableFlowcharts() {
    return Object.keys(this.flowcharts).map(key => ({
      id: key,
      name: this.flowcharts[key].name,
      description: this.flowcharts[key].description
    }));
  }

  // Get a specific flowchart
  getFlowchart(crimeType) {
    return this.flowcharts[crimeType] || null;
  }

  // Start a flowchart analysis
  startFlowchart(crimeType) {
    const flowchart = this.getFlowchart(crimeType);
    if (!flowchart) {
      throw new Error(`Flowchart not found for crime type: ${crimeType}`);
    }

    return {
      crimeType,
      flowchart: flowchart.name,
      currentNode: flowchart.startNode,
      path: [],
      elements: [],
      status: 'in_progress'
    };
  }

  // Process a response and move to next node
  processResponse(session, response) {
    const flowchart = this.getFlowchart(session.crimeType);
    const currentNode = flowchart.nodes[session.currentNode];
    
    if (!currentNode) {
      throw new Error(`Invalid node: ${session.currentNode}`);
    }

    // Record the path taken
    const pathEntry = {
      node: session.currentNode,
      question: currentNode.question,
      response: response,
      legalElement: currentNode.legalElement,
      timestamp: new Date().toISOString()
    };

    const newPath = [...session.path, pathEntry];
    const newElements = [...session.elements];

    // Add legal element if response is positive
    if (response === 'yes' && currentNode.legalElement) {
      newElements.push({
        element: currentNode.legalElement,
        satisfied: true,
        node: session.currentNode
      });
    } else if (response === 'no' && currentNode.legalElement) {
      newElements.push({
        element: currentNode.legalElement,
        satisfied: false,
        node: session.currentNode
      });
    }

    // Determine next node
    let nextNode;
    if (response === 'yes') {
      nextNode = currentNode.yesNext;
    } else if (response === 'no') {
      nextNode = currentNode.noNext;
    } else {
      throw new Error('Response must be "yes" or "no"');
    }

    // Check if we've reached a conclusion
    const nextNodeData = flowchart.nodes[nextNode];
    const isComplete = nextNodeData && nextNodeData.type === 'conclusion';

    return {
      ...session,
      currentNode: nextNode,
      path: newPath,
      elements: newElements,
      status: isComplete ? 'complete' : 'in_progress',
      conclusion: isComplete ? nextNodeData : null
    };
  }

  // Get the current question for a session
  getCurrentQuestion(session) {
    const flowchart = this.getFlowchart(session.crimeType);
    const currentNode = flowchart.nodes[session.currentNode];
    
    return {
      question: currentNode.question,
      description: currentNode.description,
      legalElement: currentNode.legalElement,
      nodeId: session.currentNode
    };
  }

  // Analyze the constituent elements status
  analyzeElements(session) {
    const satisfied = session.elements.filter(e => e.satisfied);
    const unsatisfied = session.elements.filter(e => !e.satisfied);
    
    return {
      totalElements: session.elements.length,
      satisfied: satisfied.length,
      unsatisfied: unsatisfied.length,
      satisfactionRate: session.elements.length > 0 ? 
        (satisfied.length / session.elements.length) * 100 : 0,
      satisfiedElements: satisfied.map(e => e.element),
      unsatisfiedElements: unsatisfied.map(e => e.element),
      criticalFailures: unsatisfied.filter(e => this.isCriticalElement(e.element))
    };
  }

  // Check if an element is critical for the crime
  isCriticalElement(element) {
    const criticalElements = [
      'violence_or_threat',
      'taking_of_property',
      'criminal_intent',
      'theftuous_intent',
      'bodily_harm',
      'intentional_conduct'
    ];
    
    return criticalElements.includes(element);
  }

  // Generate a legal analysis report
  generateAnalysisReport(session) {
    if (session.status !== 'complete') {
      throw new Error('Cannot generate report for incomplete session');
    }

    const elementAnalysis = this.analyzeElements(session);
    const flowchart = this.getFlowchart(session.crimeType);
    const conclusion = session.conclusion;

    return {
      crimeType: session.crimeType,
      conclusion: conclusion.result,
      confidence: conclusion.confidence,
      applicableArticle: conclusion.article || null,
      penalty: conclusion.penalty || null,
      alternative: conclusion.alternative || null,
      elementAnalysis,
      pathTaken: session.path.map(p => ({
        question: p.question,
        response: p.response,
        element: p.legalElement
      })),
      recommendations: this.generateRecommendations(session, elementAnalysis),
      timestamp: new Date().toISOString()
    };
  }

  // Generate legal recommendations based on analysis
  generateRecommendations(session, elementAnalysis) {
    const recommendations = [];
    
    if (session.conclusion.confidence === 'high') {
      if (session.conclusion.result.includes('ESTABLISHED')) {
        recommendations.push('Strong case for prosecution');
        recommendations.push('Gather evidence to support each constituent element');
      } else {
        recommendations.push('Consider alternative charges');
        recommendations.push('Review evidence for other potential offenses');
      }
    } else if (session.conclusion.confidence === 'medium') {
      recommendations.push('Additional investigation needed');
      recommendations.push('Consider expert legal consultation');
      recommendations.push('Gather more evidence for uncertain elements');
    } else {
      recommendations.push('Weak case - consider dropping charges');
      recommendations.push('Focus on civil remedies if applicable');
    }

    // Add specific recommendations based on unsatisfied elements
    if (elementAnalysis.criticalFailures.length > 0) {
      recommendations.push('Critical elements not satisfied - prosecution unlikely to succeed');
    }

    if (session.conclusion.alternative) {
      recommendations.push(`Consider: ${session.conclusion.alternative}`);
    }

    return recommendations;
  }

  // Suggest relevant flowcharts based on case description
  suggestFlowcharts(caseDescription) {
    const description = caseDescription.toLowerCase();
    const suggestions = [];

    // Simple keyword matching for suggestions
    if (description.includes('violence') || description.includes('force') || description.includes('threat')) {
      if (description.includes('property') || description.includes('money') || description.includes('steal')) {
        suggestions.push({
          id: 'robbery',
          reason: 'Violence/force + property taking suggests robbery',
          confidence: 'high'
        });
      }
      suggestions.push({
        id: 'assault',
        reason: 'Violence/force suggests assault',
        confidence: 'medium'
      });
    }

    if (description.includes('steal') || description.includes('theft') || description.includes('took')) {
      suggestions.push({
        id: 'theft',
        reason: 'Taking of property suggests theft',
        confidence: 'high'
      });
    }

    if (description.includes('hit') || description.includes('punch') || description.includes('attack')) {
      suggestions.push({
        id: 'assault',
        reason: 'Physical violence suggests assault',
        confidence: 'high'
      });
    }

    return suggestions;
  }
}

export default ConstituentElementFlowchart; 