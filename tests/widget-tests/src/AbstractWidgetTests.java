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

    /**
     * Asserts that there is an indicator positioned on top of the given element. This verifies the actual coordinates
     * of the elements on the page. An optional corner description can be passed in (a String containing the words "top",
     * "left", "bottom", or "right").
     */
    public void assertMediaIndicatorOverElement(WebElement mediaElement, String corner) {
        List<WebElement> indicators = driver.findElementsByClassName(AntennaConstants.CLASS_MEDIA_INDICATOR);
        for (Iterator<WebElement> iterator = indicators.iterator(); iterator.hasNext();) {
            WebElement indicator = iterator.next();
            Point indicatorLocation = indicator.getLocation();
            Point mediaTopLeft = mediaElement.getLocation();
            Dimension mediaSize = mediaElement.getSize();
            Point mediaBottomRight = new Point(mediaTopLeft.getX() + mediaSize.getWidth(), mediaTopLeft.getY() + mediaSize.getHeight());
            if (indicatorLocation.getX() >= mediaTopLeft.getX() && indicatorLocation.getX() <= mediaBottomRight.getX() &&
                    indicatorLocation.getY() >= mediaTopLeft.getY() && indicatorLocation.getY() <= mediaBottomRight.getY()) {
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
                return;
            }
        }
        Assert.fail("no media indicator found positioned over media");
    }
}
