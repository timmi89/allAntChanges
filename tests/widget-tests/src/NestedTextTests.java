import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import java.util.List;

/**
 * Tests our handling of elements nested inside text content blocks, ensuring that we insert indicators where expected.
 */
public class NestedTextTests extends AbstractWidgetTests {

    private static String url = "http://localhost:3000/pages/nested-text/page.html";

    /**
     * p
     *   textnode
     *   [indicator]
     */
    @Test
    public void testBodyIsText() {
        driver.get(url);
        WebElement pTag = driver.findElementById("p1");
        assertTextIndicatorCount(pTag, 1);

        WebElement indicator = findByXpath(String.format("text()/following-sibling::span[contains(@class, '%s')]", AntennaConstants.CLASS_TEXT_INDICATOR), pTag);
        Assert.assertNotNull("text indicator not found", indicator);
    }

    /**
     * p
     *   textnode
     *   img
     *   [indicator]
     */
    @Test
    public void testBodyIsTextImage() {
        driver.get(url);
        WebElement pTag = driver.findElementById("p2");
        assertTextIndicatorCount(pTag, 1);

        WebElement indicator = findByXpath(String.format("text()/following-sibling::span[contains(@class, '%s')]", AntennaConstants.CLASS_TEXT_INDICATOR), pTag);
        Assert.assertNotNull("text indicator not found where expected", indicator);

        WebElement image = findByXpath(String.format("span[contains(@class, '%s')]/following-sibling::img", AntennaConstants.CLASS_TEXT_INDICATOR), pTag);
        Assert.assertNotNull("image not found where expected", image);
    }

    /**
     * p
     *   textnode
     *   img
     *   textnode
     *   [indicator]
     */
    @Test
    public void testBodyIsTextImageText() {
        driver.get(url);
        WebElement pTag = driver.findElementById("p3");
        assertTextIndicatorCount(pTag, 1);

        WebElement indicator = findByXpath(String.format("text()[2]/following-sibling::span[contains(@class, '%s')]", AntennaConstants.CLASS_TEXT_INDICATOR), pTag);
        Assert.assertNotNull("indicator not found where expected", indicator);
    }

    /**
     * p
     *   textnode
     *   span
     *     img
     *     textnode
     *   [indicator]
     */
    @Test
    public void testBodyIsTextSpanNestedImageText() {
        driver.get(url);
        WebElement pTag = driver.findElementById("p4");
        assertTextIndicatorCount(pTag, 1);

        WebElement indicator = findByXpath(String.format("span/following-sibling::span[contains(@class, '%s')]", AntennaConstants.CLASS_TEXT_INDICATOR), pTag);
        Assert.assertNotNull("indicator not found where expected", indicator);
    }

    /**
     * p
     *   textnode
     *   img
     *   strong
     *     textnode
     *   [indicator]
     */
    @Test
    public void testBodyIsTextImageStrong() {
        driver.get(url);
        WebElement pTag = driver.findElementById("p5");
        assertTextIndicatorCount(pTag, 1);

        WebElement indicator = findByXpath(String.format("strong/following-sibling::span[contains(@class, '%s')]", AntennaConstants.CLASS_TEXT_INDICATOR), pTag);
        Assert.assertNotNull("indicator not found where expected", indicator);
    }

    /**
     * p
     *   textnode
     *   img
     *   [indicator]
     *   img
     */
    @Test
    public void testBodyIsTextImageImage() {
        driver.get(url);
        WebElement pTag = driver.findElementById("p6");
        assertTextIndicatorCount(pTag, 1);

        WebElement indicator = findByXpath(String.format("img/following-sibling::span[contains(@class, '%s')]", AntennaConstants.CLASS_TEXT_INDICATOR), pTag);
        Assert.assertNotNull("indicator not found where expected", indicator);

        WebElement imageAfterIndicator = findByXpath(String.format("span[contains(@class, '%s')]/following-sibling::img", AntennaConstants.CLASS_TEXT_INDICATOR), pTag);
        Assert.assertNotNull("indicator not found where expected", imageAfterIndicator);
    }

    /**
     * p
     *   textnode
     *   span
     *     img
     *   span
     *     [indicator]
     *     img
     */
    @Test
    public void testBodyIsTextSpanNestedImage() {
        driver.get(url);
        WebElement pTag = driver.findElementById("p7");
        assertTextIndicatorCount(pTag, 1);

        WebElement imageFollowingIndicator = findByXpath(String.format("span[2]/span[contains(@class, '%s')]/following-sibling::img", AntennaConstants.CLASS_TEXT_INDICATOR), pTag);
        Assert.assertNotNull("indicator not found where expected", imageFollowingIndicator);
    }

    /**
     * p
     *   span
     *     textnode
     *   span
     *     textnode
     *   [indicator]
     */
    @Test
    public void testBodyIsSpanNestedText() {
        driver.get(url);
        WebElement pTag = driver.findElementById("p8");
        assertTextIndicatorCount(pTag, 1);

        WebElement imageFollowingIndicator = findByXpath(String.format("span[2]/following-sibling::span[contains(@class, '%s')]", AntennaConstants.CLASS_TEXT_INDICATOR), pTag);
        Assert.assertNotNull("indicator not found where expected", imageFollowingIndicator);
    }

    public void assertTextIndicatorCount(WebElement parent, int count) {
        List<WebElement> textIndicators = parent.findElements(By.className(AntennaConstants.CLASS_TEXT_INDICATOR));
        // TODO: consider retrying this a few times to account for any delay
        Assert.assertEquals("wrong number of text indicators", count, textIndicators.size());
    }

}
