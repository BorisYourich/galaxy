/* Utility to load a specific page and output html, page text, or a screenshot
 *  Optionally wait for some time, text, or dom selector
 */
try {
    //...if there's a better way - please let me know, universe
    var scriptDir = require( 'system' ).args[3]
            // remove the script filename
            .replace( /[\w|\.|\-|_]*$/, '' )
            // if given rel. path, prepend the curr dir
            .replace( /^(?!\/)/, './' ),
        spaceghost = require( scriptDir + 'spaceghost' ).create({
            // script options here (can be overridden by CLI)
            //verbose: true,
            //logLevel: debug,
            scriptDir: scriptDir
        });

} catch( error ){
    console.debug( error );
    phantom.exit( 1 );
}
spaceghost.start();


// =================================================================== SET UP
var utils = require( 'utils' );

var email = spaceghost.user.getRandomEmail(),
    password = '123456';
if( spaceghost.fixtureData.testUser ){
    email = spaceghost.fixtureData.testUser.email;
    password = spaceghost.fixtureData.testUser.password;
}
var inaccessibleHistory, accessibleHistory, publishedHistory,
    inaccessibleHdas, accessibleHdas, publishedHdas,
    accessibleLink;

//// ------------------------------------------------------------------------------------------- create 3 histories
spaceghost.user.loginOrRegisterUser( email, password );
spaceghost.thenOpen( spaceghost.baseUrl ).then( function(){
    // create three histories: make the 2nd importable (via the API), and the third published

    // make the current the inaccessible one
    inaccessibleHistory = this.api.histories.show( 'current' );
    this.api.histories.update( inaccessibleHistory.id, { name: 'inaccessible' });
    inaccessibleHistory = this.api.histories.show( 'current' );

    accessibleHistory = this.api.histories.create({ name: 'accessible' });
    var returned = this.api.histories.update( accessibleHistory.id, {
        importable  : true
    });
    //this.debug( this.jsonStr( returned ) );
    accessibleHistory = this.api.histories.show( accessibleHistory.id );

    publishedHistory =  this.api.histories.create({ name: 'published' });
    returned = this.api.histories.update( publishedHistory.id, {
        published  : true
    });
    //this.debug( this.jsonStr( returned ) );
    publishedHistory = this.api.histories.show( publishedHistory.id );

});

//// ------------------------------------------------------------------------------------------- upload some files
spaceghost.then( function(){
    this.api.tools.thenUpload( inaccessibleHistory.id, { filepath: this.options.scriptDir + '/../../test-data/1.bed' });
    this.api.tools.thenUpload(   accessibleHistory.id, { filepath: this.options.scriptDir + '/../../test-data/1.bed' });
    this.api.tools.thenUpload(    publishedHistory.id, { filepath: this.options.scriptDir + '/../../test-data/1.bed' });
});
spaceghost.then( function(){
    // check that they're there
    inaccessibleHdas = this.api.hdas.index( inaccessibleHistory.id ),
      accessibleHdas = this.api.hdas.index(   accessibleHistory.id ),
       publishedHdas = this.api.hdas.index(    publishedHistory.id );
});
spaceghost.user.logout();

// =================================================================== TESTS
//// ------------------------------------------------------------------------------------------- anon user
function testAnonReadFunctionsOnAccessible( history, hdas ){
    this.test.comment( '---- testing read/accessibility functions for ACCESSIBLE history: ' + history.name );

    // read functions for history
    this.test.comment( 'show should work for history: ' + history.name );
    this.test.assert( this.api.histories.show( history.id ).id === history.id,
        'show worked' );
    this.test.comment( 'copying should fail for history (multiple histories not allowed): ' + history.name );
    this.api.assertRaises( function(){
        this.api.histories.create({ history_id : history.id });
    }, 403, 'API authentication required for this request', 'update authentication required' );

    // read functions for history contents
    this.test.comment( 'index of history contents should work for history: ' + history.name );
    this.test.assert( this.api.hdas.index( history.id ).length === 1,
        'hda index worked' );
    this.test.comment( 'showing of history contents should work for history: ' + history.name );
    this.test.assert( this.api.hdas.show( history.id, hdas[0].id ).id === hdas[0].id,
        'hda show worked' );

    this.test.comment( 'Attempting to copy an accessible hda (default is accessible)'
                     + ' fails from accessible history (currently login is required): ' + history.name );
    this.api.assertRaises( function(){
        this.api.hdas.create( this.api.histories.show( 'current' ).id, {
            source  : 'hda',
            content : hdas[0].id
        });
    }, 403, 'API authentication required for this request', 'update authentication required' );
}

function testAnonReadFunctionsOnInaccessible( history, hdas ){
    this.test.comment( '---- testing read/accessibility functions for INACCESSIBLE history: ' + history.name );

    // read functions for history
    this.test.comment( 'show should fail for history: ' + history.name );
    this.api.assertRaises( function(){
        this.api.histories.show( history.id );
    }, 403, 'History is not accessible to the current user', 'show failed with error' );
    this.test.comment( 'copying should fail for history (implicit multiple histories): ' + history.name );
    this.api.assertRaises( function(){
        this.api.histories.create({ history_id : history.id });
    }, 403, 'API authentication required for this request', 'copy failed with error' );

    // read functions for history contents
    this.test.comment( 'index and show of history contents should fail for history: ' + history.name );
    this.api.assertRaises( function(){
        this.api.hdas.index( history.id );
    }, 403, 'History is not accessible to the current user', 'hda index failed with error' );
    this.api.assertRaises( function(){
        this.api.hdas.show( history.id, hdas[0].id );
    }, 403, 'History is not accessible to the current user', 'hda show failed with error' );

    this.test.comment( 'Attempting to copy an accessible hda (default is accessible)'
                     + ' from an inaccessible history should fail for: ' + history.name );
    this.api.assertRaises( function(){
        var returned = this.api.hdas.create( this.api.histories.show( 'current' ).id, {
            source  : 'hda',
            content : hdas[0].id
        });
        this.debug( this.jsonStr( returned ) );
    }, 403, 'API authentication required for this request', 'hda copy from failed with error' );

}

function testAnonWriteFunctions( history, hdas ){
    this.test.comment( '---- testing write/ownership functions for history: ' + history.name );

    this.test.comment( 'update should fail for history: ' + history.name );
    this.api.assertRaises( function(){
        this.api.histories.update( history.id, { deleted: true });
    }, 403, 'API authentication required for this request', 'update authentication required' );
    this.test.comment( 'delete should fail for history: ' + history.name );
    this.api.assertRaises( function(){
        this.api.histories.delete_( history.id );
    }, 403, 'API authentication required for this request', 'delete authentication required' );
    this.test.comment( 'set_as_current should fail for history: ' + history.name );
    this.api.assertRaises( function(){
        this.api.histories.set_as_current( history.id );
    }, 403, 'API authentication required for this request', 'set_as_current failed with error' );

    this.test.comment( 'hda updating should fail for history: ' + history.name );
    this.api.assertRaises( function(){
        this.api.hdas.update( history.id, hdas[0].id, { deleted: true });
    // anon hda update fails w/ this msg if trying to update non-current history hda
    }, 403, 'You must be logged in to update this history', 'hda update failed with error' );
    this.test.comment( 'hda deletion should fail for history: ' + history.name );
    this.api.assertRaises( function(){
        this.api.hdas.delete_( history.id, hdas[0].id );
    }, 403, 'API authentication required for this request', 'hda delete failed with error' );

    this.test.comment( 'copying hda into history should fail for history: ' + history.name );
    this.api.assertRaises( function(){
        this.api.hdas.create( history.id, {
            source  : 'hda',
            // should error before it checks the id
            content : 'bler'
        });
    }, 403, 'API authentication required for this request', 'hda copy to failed' );
}

function testAnonInaccessible( history, hdas ){
    testAnonReadFunctionsOnInaccessible.call( this, history, hdas );
    testAnonWriteFunctions.call( this, history, hdas );
}

function testAnonAccessible( history, hdas ){
    testAnonReadFunctionsOnAccessible.call( this, history, hdas );
    testAnonWriteFunctions.call( this, history, hdas );
}

spaceghost.thenOpen( spaceghost.baseUrl ).then( function(){
    testAnonInaccessible.call( spaceghost, inaccessibleHistory, inaccessibleHdas );
    testAnonAccessible.call( spaceghost, accessibleHistory, accessibleHdas );
    testAnonAccessible.call( spaceghost, publishedHistory, publishedHdas );
});


// ------------------------------------------------------------------------------------------- user1 revoke perms
spaceghost.user.loginOrRegisterUser( email, password );
spaceghost.thenOpen( spaceghost.baseUrl ).then( function(){
    this.test.comment( 'revoking perms should prevent access' );
    this.api.histories.update( accessibleHistory.id, {
        importable : false
    });
    var returned = this.api.histories.show( accessibleHistory.id );

    this.api.histories.update( publishedHistory.id, {
        importable : false,
        published  : false
    });
    returned = this.api.histories.show( publishedHistory.id );
});
spaceghost.user.logout();


// ------------------------------------------------------------------------------------------- anon retry perms
spaceghost.thenOpen( spaceghost.baseUrl ).then( function(){
    testAnonInaccessible.call( spaceghost, accessibleHistory, accessibleHdas );
    testAnonInaccessible.call( spaceghost, publishedHistory, publishedHdas );
});


// ===================================================================
spaceghost.run( function(){
});
