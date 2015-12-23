import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

/**
 * Tests our handling of single page apps (sites that don't rely on the browser to navigate between "pages").
 */
public class SinglePageAppTests extends AbstractWidgetTests {

    private static String url = computeUrl("/pages/single-page-app/page.html");

    @Test
    public void testSummaryWidgetUpdates() {
        driver.get(url);
        assertSummaryCount(2);

        clickButton("page1-inner");
        assertSummaryCount(5);

        clickButton("page2-inner");
        assertSummaryCount(7);

        clickButton("page3-inner");
        assertSummaryCount(9);
    }

    @Test
    public void testTextElements() {
        driver.get(url);

        clickButton("page1-inner");
        sleep(500);
        assertPageTextCounts("page1", 3, 0);

        clickButton("page2-inner");
        sleep(500);
        assertPageTextCounts("page2", 0, 7);

        clickButton("page3-inner");
        sleep(500);
        assertPageTextCounts("page3", 9, 0);
    }

    private void assertPageTextCounts(String pageId, int p1Count, int p2Count) {
        WebElement page = findById(pageId);
        WebElement p1 = findByClassName("p1", page);
        WebElement p2 = findByClassName("p2", page);
        Assert.assertNotNull(p1);
        Assert.assertNotNull(p2);
        assertTextReactionCount(p1, p1Count);
        assertTextReactionCount(p2, p2Count);
    }

}
