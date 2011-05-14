var text = new Array(3), url = new Array(3), n = Math.floor (Math.random()*3);

text[0] = 'Get 18 Issues FREE when you subscribe to The Monitor today!';
url[0] = 'https://w1.buysub.com/servlet/OrdersGateway?cds_mag_code=CSX&cds_page_id=67239&cds_response_key=I1ACSXTB5';
text[1] = 'Try the new weekly Monitor at a price so low... it\'s like getting 18 issues FREE!';
url[1] = 'https://w1.buysub.com/servlet/OrdersGateway?cds_mag_code=CSX&cds_page_id=67239&cds_response_key=I1ACSXTB2';
text[2] = 'Click here to receive the next full month of the Daily News Briefing &#150; a new news service from The Christian Science Monitor &#150; ABSOLUTELY FREE&#33;';
url[2] = 'https://w1.buysub.com/servlet/OrdersGateway?cds_mag_code=CTE&cds_page_id=76047&cds_response_key=I1ACTETB1';

document.write ('<h2 style="color: ff0000;"><a style="color: #cc0000;" href="' + url[n] + '">' + text[n] + '</a></h2>');

