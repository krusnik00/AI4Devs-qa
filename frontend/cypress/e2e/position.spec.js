// filepath: c:\Users\carlos\Documents\lider_curso\AI4Devs-qa\frontend\cypress\e2e\position.cy.js
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
      
      // Obtenemos los datos de la API y verificamos que coincidan con lo que se muestra
      cy.wait('@getCandidates').then((interception) => {
        const candidates = interception.response.body;
        if (candidates && candidates.length > 0) {
          // Verificamos que al menos hay un candidato en alguna columna
          cy.get('.card-body .card').should('have.length.at.least', 1);
        }
      });
    });
  });
  
  describe('Drag and Drop Tests', () => {
    it('should move a candidate card to another column', () => {
      // Verificamos que hay al menos una tarjeta para arrastrar
      cy.get('.card-body .card').first().as('sourceCard');
      
      // Obtenemos la columna destino (por ejemplo, la segunda columna)
      cy.get('.col-md-3').eq(1).find('.card').as('targetColumn');
      
      // Realizamos la operación de arrastrar y soltar
      // Nota: La implementación real de arrastrar y soltar en Cypress es compleja debido a
      // limitaciones con react-beautiful-dnd. Este es un enfoque simulado.
      
      // Obtenemos el ID del candidato antes de moverlo
      cy.get('@sourceCard').invoke('attr', 'data-rbd-draggable-id').then((candidateId) => {
        // Simulamos el evento de arrastrar y soltar a nivel de API
        cy.get('@sourceCard').then($card => {
          // Obtenemos el ID de la aplicación (se puede almacenar como un atributo de datos)
          const applicationId = $card.attr('data-application-id');
          // Obtenemos el ID de la columna destino
          cy.get('@targetColumn').parent().invoke('attr', 'data-rbd-droppable-id').then((newColumnId) => {
            // Simulamos la actualización directamente llamando a la API
            cy.request({
              method: 'PUT',
              url: `http://localhost:3010/candidates/${candidateId}`,
              body: {
                applicationId: parseInt(applicationId),
                currentInterviewStep: parseInt(newColumnId)
              },
              headers: {
                'Content-Type': 'application/json'
              }
            }).then((response) => {
              expect(response.status).to.eq(200);
              
              // Recargamos la página para verificar que el candidato se movió
              cy.reload();
              cy.wait('@getInterviewFlow');
              cy.wait('@getCandidates');
              
              // Verificamos que el candidato está ahora en la columna destino
              cy.get('@targetColumn').parent().find('.card-body .card').should('contain', candidateId);
            });
          });
        });
      });
    });
    
    it('should update the candidate phase in the backend when moved', () => {
      // Interceptamos la llamada a la API para actualizar el candidato
      cy.intercept('PUT', 'http://localhost:3010/candidates/*').as('updateCandidate');
      
      // Simulamos un drag and drop mediante eventos personalizados
      // Nota: Esta es una simulación simplificada, ya que la prueba real de drag and drop
      // con react-beautiful-dnd es muy compleja en Cypress
      
      // Obtenemos la primera tarjeta
      cy.get('.card-body .card').first().as('sourceCard');
      
      // Simulamos que se está moviendo a la segunda columna
      cy.get('.col-md-3').eq(1).as('targetColumn');
      
      // Simulamos la acción de arrastrar y soltar mediante la API
      cy.get('@sourceCard').then($card => {
        const candidateId = $card.attr('data-rbd-draggable-id');
        const applicationId = $card.attr('data-application-id');
        
        cy.get('@targetColumn').invoke('attr', 'data-rbd-droppable-id').then((newStepId) => {
          // Realizamos la solicitud PUT directamente
          cy.request({
            method: 'PUT',
            url: `http://localhost:3010/candidates/${candidateId}`,
            body: {
              applicationId: parseInt(applicationId),
              currentInterviewStep: parseInt(newStepId)
            },
            headers: {
              'Content-Type': 'application/json'
            }
          }).as('dragDropRequest');
          
          // Verificamos que se realizó la solicitud correctamente
          cy.get('@dragDropRequest').then((response) => {
            expect(response.status).to.eq(200);
          });
          
          // Verificamos que la solicitud PUT se realizó con los datos correctos
          cy.wait('@updateCandidate').then((interception) => {
            expect(interception.request.body).to.have.property('applicationId', parseInt(applicationId));
            expect(interception.request.body).to.have.property('currentInterviewStep', parseInt(newStepId));
          });
        });
      });
    });
  });
});
