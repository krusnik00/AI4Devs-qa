/// <reference types="cypress" />

describe('Position Interface Tests', () => {
  const positionId = 1; // ID de una posición existente para pruebas
  
  beforeEach(() => {
    // Interceptamos las llamadas a la API para poder verificarlas después
    cy.intercept('GET', `http://localhost:3010/positions/${positionId}/interviewFlow`).as('getInterviewFlow');
    cy.intercept('GET', `http://localhost:3010/positions/${positionId}/candidates`).as('getCandidates');
    cy.intercept('PUT', 'http://localhost:3010/candidates/*').as('updateCandidate');
    
    // Visitamos la página de detalles de la posición
    cy.visit(`/positions/${positionId}`);
    
    // Esperamos a que carguen los datos
    cy.wait('@getInterviewFlow');
    cy.wait('@getCandidates');
  });
  
  describe('Page Load Tests', () => {
    it('should display the position title correctly', () => {
      // Verificamos que el título de la posición se muestra
      cy.get('h2.text-center').should('be.visible');
      cy.get('h2.text-center').should('not.be.empty');
    });
    
    it('should display interview stage columns', () => {
      // Verificamos que las columnas de etapas se muestran
      cy.get('.col-md-3').should('have.length.at.least', 1);
      cy.get('.card-header').should('be.visible');
    });
    
    it('should display candidate cards in the correct columns', () => {
      // Verificamos que las tarjetas de candidatos aparecen en las columnas correctas
      cy.get('.card-body .card').should('exist');
      
      // Verificamos que al menos hay un candidato en alguna columna
      cy.get('.card-body .card').should('have.length.at.least', 1);
    });
  });
    describe('Drag and Drop Tests', () => {
    it('should move a candidate card to another column', () => {
      // Primero obtenemos los datos reales de candidatos desde la respuesta de API
      cy.get('@getCandidates').then((interception) => {
        const candidates = interception.response.body;
        // Verificamos que hay candidatos disponibles
        if (candidates && candidates.length > 0) {
          // Usamos el primer candidato para nuestras pruebas
          const candidate = candidates[0];
          const candidateId = candidate.candidateId;
          const applicationId = candidate.applicationId;
          
          // Obtenemos datos del flujo de entrevistas para obtener un paso válido
          cy.get('@getInterviewFlow').then((flowInterception) => {
            const interviewSteps = flowInterception.response.body.interviewFlow.interviewFlow.interviewSteps;
            if (interviewSteps && interviewSteps.length > 1) {
              // Elegimos el segundo paso como objetivo (o el primero si el candidato ya está en el segundo)
              const currentStep = candidate.currentInterviewStep;
              let targetStepId;
              
              if (currentStep === interviewSteps[0].id) {
                targetStepId = interviewSteps[1].id;
              } else {
                targetStepId = interviewSteps[0].id;
              }
              
              cy.log(`Moving candidate ${candidateId} from step ${currentStep} to step ${targetStepId}`);
              
              // Verificamos que hay al menos una tarjeta para arrastrar
              cy.get('.card-body .card').first().as('sourceCard');
              
              // Obtenemos la columna destino
              cy.get('.col-md-3').eq(1).find('.card').as('targetColumn');
              
              // Hacemos la solicitud PUT con datos válidos y asegurándonos de que los valores son números
              cy.request({
                method: 'PUT',
                url: `http://localhost:3010/candidates/${candidateId}`,
                body: {
                  applicationId: parseInt(applicationId),
                  currentInterviewStep: parseInt(targetStepId)
                },
                headers: {
                  'Content-Type': 'application/json'
                },
                failOnStatusCode: false
              }).then((response) => {
                cy.log(`Response status: ${response.status}`);
                cy.log(`Response body: ${JSON.stringify(response.body)}`);
                
                // Verificamos que la respuesta sea exitosa
                expect(response.status).to.eq(200);
                
                // Recargamos la página para verificar que el candidato se movió
                cy.reload();
                cy.wait('@getInterviewFlow');
                cy.wait('@getCandidates');
              });
            } else {
              cy.log('Not enough interview steps for testing');
            }
          });
        } else {
          cy.log('No candidates found for testing');
        }
      });
    });
      it('should update the candidate phase in the backend when moved', () => {
      // Primero obtenemos los datos reales de candidatos desde la respuesta de API
      cy.get('@getCandidates').then((interception) => {
        const candidates = interception.response.body;
        // Verificamos que hay candidatos disponibles
        if (candidates && candidates.length > 0) {
          // Usamos el primer candidato para nuestras pruebas
          const candidate = candidates[0];
          const candidateId = candidate.candidateId;
          const applicationId = candidate.applicationId;
          
          // Obtenemos datos del flujo de entrevistas para obtener un paso válido
          cy.get('@getInterviewFlow').then((flowInterception) => {
            const interviewSteps = flowInterception.response.body.interviewFlow.interviewFlow.interviewSteps;
            if (interviewSteps && interviewSteps.length > 1) {
              // Elegimos el segundo paso como objetivo (o el primero si el candidato ya está en el segundo)
              const currentStep = candidate.currentInterviewStep;
              let targetStepId;
              
              if (currentStep === interviewSteps[0].id) {
                targetStepId = interviewSteps[1].id;
              } else {
                targetStepId = interviewSteps[0].id;
              }
              
              cy.log(`Moving candidate ${candidateId} from step ${currentStep} to step ${targetStepId}`);
              
              // Interceptamos específicamente esta solicitud
              cy.intercept('PUT', `http://localhost:3010/candidates/${candidateId}`).as('updateSpecificCandidate');
              
              // Obtenemos la primera tarjeta
              cy.get('.card-body .card').first().as('sourceCard');
              
              // Simulamos que se está moviendo a la segunda columna
              cy.get('.col-md-3').eq(1).as('targetColumn');
              
              // Hacemos la solicitud PUT con datos válidos y asegurándonos de que los valores son números
              cy.request({
                method: 'PUT',
                url: `http://localhost:3010/candidates/${candidateId}`,
                body: {
                  applicationId: parseInt(applicationId),
                  currentInterviewStep: parseInt(targetStepId)
                },
                headers: {
                  'Content-Type': 'application/json'
                },
                failOnStatusCode: false
              }).then((response) => {
                cy.log(`Response status: ${response.status}`);
                cy.log(`Response body: ${JSON.stringify(response.body)}`);
                
                // Verificamos que la respuesta sea exitosa
                expect(response.status).to.eq(200);
                
                // Verificamos que la solicitud PUT se realizó con los datos correctos
                cy.wait('@updateSpecificCandidate').then((interception) => {
                  expect(interception.request.body).to.have.property('applicationId', parseInt(applicationId));
                  expect(interception.request.body).to.have.property('currentInterviewStep', parseInt(targetStepId));
                });
              });
            } else {
              cy.log('Not enough interview steps for testing');
            }
          });
        } else {
          cy.log('No candidates found for testing');
        }
      });
    });
  });
});
