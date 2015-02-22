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


module.exports = ContentFilter;

function ContentFilter(list){
    
    var margin = '(?:\\b|[\\x20-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\x7e])';
	this.regex = new RegExp(margin + '(' + list.join('|') +  ')' + margin,'i');
	
}

ContentFilter.prototype.html = function(text){
    this.regex;
    var $this = this;
    $ = cheerio.load(text,{decodeEntities: false});
  
    //title 
    $('title').text();
    //<meta name="description"
    $('meta[name=description]').attr('content');
    //<meta name="keywords"
    $('meta[name=keywords]').attr('content');
    
    var listtext = [];

    $('div,li,a,p,body').each(function(i,elm){
        var text = $(elm).text().trim();
        if(text.length)
            listtext.push({ length: text.length  , elm: elm });
    });

    listtext = listtext.sort(function(a,b){
        return a.length - b.length;
    });
    
    var sumall = 0;
    var sumbad = 0;
    
    listtext.forEach(function(item){
        var text = ' ' + entities.decodeHTML($(item.elm).text().trim()) + ' ';
       
        if($this.regex.test(text)){
            $(item.elm).remove();
            sumbad += text.length;
        }
        sumall += text.length;
    });
    
    return { text: $.html({decodeEntities: false}) , remove: sumbad ,length: sumall }   ;
};
