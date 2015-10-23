import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.FirefoxDriver;

import java.util.Iterator;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Abstract base class for our widget tests.
 */
public class AbstractWidgetTests {

    protected static FirefoxDriver driver;

    @BeforeClass
    public static void setupDriver() {
        driver = new FirefoxDriver();
        driver.manage().timeouts().implicitlyWait(3, TimeUnit.SECONDS);
    }

    @AfterClass
    public static void quitDriver() {
        driver.quit();
    }

    /**
     * Attempts to find an element and returns either the element or null.
     */
    public WebElement findByXpath(String xpath) {
        WebElement element = null;
        try {
            element = driver.findElement(By.xpath(xpath));
        } catch (NoSuchElementException e) {
            // Do nothing!
        }
        return element;
    }

    public WebElement findByXpath(String xpath, WebElement parent) {
        WebElement element = null;
        try {
            element = parent.findElement(By.xpath(xpath));
        } catch (NoSuchElementException e) {
            // Do nothing!
        }
        return element;
    }

    /**
     * Attempts to find an element and returns either the element or null.
     */
    public WebElement findById(String id) {
        WebElement element = null;
        try {
            element = driver.findElement(By.id(id));
        } catch (NoSuchElementException e) {
            // Do nothing!
        }
        return element;
    }

    /**
     * Returns the media indicator widget that corresponds to the given media element or <code>null</code> if none is
     * found.
     */
    public WebElement findMediaIndicator(WebElement mediaElement, int count) {
        WebElement bucket = findById(AntennaConstants.ID_WIDGET_BUCKET);
        Assert.assertNotNull("widget bucket not found", bucket);

        String mediaHash = mediaElement.getAttribute(AntennaConstants.ATTR_ANT_HASH);
        return findByXpath(String.format("(//span[@ant-hash='%s'])[%s]", mediaHash, count), bucket);
    }

    public void assertMediaIndicatorCount(int count) {
        WebElement bucket = findById(AntennaConstants.ID_WIDGET_BUCKET);
        Assert.assertNotNull("widget bucket not found", bucket);

        List<WebElement> mediaIndicators = bucket.findElements(By.className(AntennaConstants.CLASS_MEDIA_INDICATOR));
        Assert.assertEquals("wrong number of media indicators", count, mediaIndicators.size());
    }

    public void assertTextIndicatorCount(int count) {
        List<WebElement> textIndicators = driver.findElements(By.className(AntennaConstants.CLASS_TEXT_INDICATOR));
        Assert.assertEquals("wrong number of text indicators", count, textIndicators.size());
    }

    public void assertMediaIndicatorOverElement(WebElement mediaElement) {
        assertMediaIndicatorOverElement(mediaElement, null, 1);
    }

    public void assertMediaIndicatorOverElement(WebElement mediaElement, String corner) {
        assertMediaIndicatorOverElement(mediaElement, corner, 1);
    }

    public void assertMediaIndicatorOverElement(WebElement mediaElement, int instanceCount) {
        assertMediaIndicatorOverElement(mediaElement, null, instanceCount);
    }

    /**
     * Asserts that there is an indicator positioned on top of the given element. This verifies the actual coordinates
     * of the elements on the page. An optional corner description can be passed in (a String containing the words "top",
     * "left", "bottom", or "right"). instanceCount is for the case where the same media, with the same hash, can appear
     * multiple times on the page. In this case, instanceCount lets us pick the Nth indicator. instanceCount follows the
     * xpath spec and is ONE-BASED.
     */
    public void assertMediaIndicatorOverElement(WebElement mediaElement, String corner, int instanceCount) {
        WebElement indicator = findMediaIndicator(mediaElement, instanceCount);
        Assert.assertNotNull("indicator not found for media", indicator);

        Point indicatorLocation = indicator.getLocation();
        Point mediaTopLeft = mediaElement.getLocation();
        Dimension mediaSize = mediaElement.getSize();
        Point mediaBottomRight = new Point(mediaTopLeft.getX() + mediaSize.getWidth(), mediaTopLeft.getY() + mediaSize.getHeight());

        Assert.assertTrue("media indicator is too far left", indicatorLocation.getX() >= mediaTopLeft.getX());
        Assert.assertTrue("media indicator is too far right", indicatorLocation.getX() <= mediaBottomRight.getX());
        Assert.assertTrue("media indicator is too high", indicatorLocation.getY() >= mediaTopLeft.getY());
        Assert.assertTrue("media indicator is too low", indicatorLocation.getY() <= mediaBottomRight.getY());
        if (corner != null) {
            Dimension indicatorSize = indicator.getSize();
            Point indicatorBottomRight = new Point(indicatorLocation.getX() + indicatorSize.getWidth(), indicatorLocation.getY() + indicatorSize.getHeight());
            if (corner.contains("top")) {
                Assert.assertEquals("wrong indicator top location", mediaTopLeft.getY(), indicatorLocation.getY());
            } else {
                Assert.assertEquals("wrong indicator bottom location", mediaBottomRight.getY(), indicatorBottomRight.getY());
            }
            if (corner.contains("left")) {
                Assert.assertEquals("wrong indicator left location", mediaTopLeft.getX(), indicatorLocation.getX());
            } else {
                Assert.assertEquals("wrong indicator right location", mediaBottomRight.getX(), indicatorBottomRight.getX());
            }
        }
    }
}
