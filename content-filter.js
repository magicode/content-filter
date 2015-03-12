/*
* This code is the HTML content filter for NetFree.
* Steps:
* 1.Get all nodes of type : p,article,div,header,h1,h2,h3,h4,h5,h6,a,... which can contains text in them.
* 2.Group them to sections/paragraphs.
* 3.Check each section if contains bad words. If so - delete from page.
* 4.If more than 70% of the sections in the page are deleted - block the page.
*/

var entities = require("entities");
var cheerio = require("cheerio");
var acorn = require("acorn");

module.exports = ContentFilter;

function ContentFilter(options){
	this.regex = options.regex;
}

ContentFilter.prototype.html = function(text ,options){
    
    var $this = this;
    options  = options || {};
    
    $ = cheerio.load(text,{decodeEntities: false});
    
    
    var importantText = ' ';
    //title 
    importantText += $('title').text() + ' ';
    //<meta name="description"
    importantText += $('meta[name=description]').attr('content') + ' ';
    //<meta name="keywords"
    importantText += $('meta[name=keywords]').attr('content') + ' ';
    
    
    if($this.regex.test(importantText)){
        return { important: true };
    }
    
    var listtext = [];

    $('li,div,a,p,body').each(function(i,elm){
        var text = $(elm).text().trim();
        if(text.length)
            listtext.push({ length: text.length  , elm: elm });
    });

    listtext = listtext.sort(function(a,b){
        return a.length - b.length;
    });
    
    var sumall = 0;
    var sumbad = 0;
    var listRemove = [];
    listtext.forEach(function(item){
        var text = ' ' + entities.decodeHTML($(item.elm).text().trim()) + ' ';
       
        if($this.regex.test(text)){
            if(options.exportRemove){
                listRemove.push(text);
            }
            $(item.elm).remove();
            sumbad += text.length;
        }
        sumall += text.length;
    });
    
    var objRet = {};
    objRet.html =  $.html({decodeEntities: false});
    objRet.remove =sumbad;
    objRet.length =sumall;
    options.exportRemove ? objRet.listRemove = listRemove : 0 ;
    
    return objRet;
};

ContentFilter.prototype.js = function(code){
    var $this =  this;
    var outCode = '';
    var tokens = [];
    try{
        acorn.parse(code, { ranges: true,  onToken: tokens });
    }catch(e){
        return { error: e };
        
    }
    var startPoint = 0;
    var removeCount = 0;
    var length = 0;
    tokens.forEach(function(token){
        if(token.type  && token.type.type == 'string'){
            length += token.value.length;
            if($this.regex && $this.regex.test(' ' + token.value + ' ')){
                
                removeCount += token.value.length;
                
                outCode += code.substring(startPoint, token.start) + "''" ;
                startPoint = token.end;
            }
        }
    });
    
    outCode += code.substring(startPoint);
    
    return { js: outCode , remove: removeCount , length: length }; 
};

ContentFilter.prototype.json = function(json){
    
    var $this = this;
    
    var remove = 0;
    var length = 0;
    
    function stringReplace(all ,q, string){

        if(string){
            
            string = string.replace(/\\x([a-fA-F0-9]{2})/ig, function(a,b){
                return String.fromCharCode(parseInt(b,16));
            });
    
            string = string.replace(/\\u([a-fA-F0-9]{4})/ig, function(a,b){
                return String.fromCharCode(parseInt(b,16));
            });
            
            length += string.length;
            if($this.regex && $this.regex.test(' ' + string + ' ')){
                remove += string.length;
                return q + q; 
            }
        }
        return all;
    }
    
    json = json.replace(/(")((\\"|[^"])*)"/g, stringReplace);
    json = json.replace(/(')((\\'|[^'])*)'/g, stringReplace);
    
    return { json: json , remove: remove , length: length };
};


ContentFilter.prototype.text = function(text){
    var $this = this;
    
    if($this.regex && $this.regex.test(' ' + text + ' ')){
        return { text: '' };
    }
    
    return { text: text };
};

