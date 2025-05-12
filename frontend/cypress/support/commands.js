// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Comando personalizado para simular drag and drop (una aproximación, ya que react-beautiful-dnd no trabaja bien con Cypress)
Cypress.Commands.add('simulateDragDrop', (sourceSelector, targetSelector) => {
  // Obtenemos el elemento fuente y destino
  cy.get(sourceSelector).then($source => {
    const sourceId = $source.attr('data-rbd-draggable-id');
    const sourceIndex = $source.attr('data-rbd-draggable-context-id');
    
    cy.get(targetSelector).then($target => {
      const targetId = $target.attr('data-rbd-droppable-id');
      const targetIndex = $target.attr('data-rbd-droppable-context-id');
      
      // Disparamos eventos personalizados para simular el drag and drop
      // (Esto es una simulación y podría no funcionar con todas las implementaciones de react-beautiful-dnd)
      cy.window().then(win => {
        // Esta es una implementación simplificada y puede requerir ajustes según la implementación específica
        win.document.dispatchEvent(new Event('dragstart'));
        $target[0].dispatchEvent(new Event('dragover'));
        $target[0].dispatchEvent(new Event('drop'));
        win.document.dispatchEvent(new Event('dragend'));
      });
    });
  });
});
