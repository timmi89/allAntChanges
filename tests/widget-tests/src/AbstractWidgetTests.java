import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Abstract base class for our widget tests.
 */
public class AbstractWidgetTests {

//    protected static FirefoxDriver driver;
    protected static ChromeDriver driver;

    private static String TEST_SERVER_URL = "http://localhost:3001";

    public static String computeUrl(String relativePath) {
        return TEST_SERVER_URL + relativePath;
    }

    @BeforeClass
    public static void setupDriver() {
//        driver = new FirefoxDriver();
        driver = new ChromeDriver();
        driver.manage().timeouts().implicitlyWait(3, TimeUnit.SECONDS);
    }

    @AfterClass
    public static void quitDriver() {
        driver.quit();
    }

    public void hover(WebElement element) {
        Actions action = new Actions(driver);
        action.moveToElement(element).build().perform();
    }

    public void clickButton(String id) {
        WebElement button = findById(id);
        Assert.assertNotNull("button not found", button);
        button.click();
    }

    public void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            // do nothing
        }
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
        if (parent != null && xpath.startsWith("//")) {
            throw new IllegalArgumentException("A parent element was passed with an xpath that searches the entire document ('//'). Scoped xpath expressions should start with './/' instead.");
        }
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

    public WebElement findByClassName(String className, WebElement parent) {
        WebElement element = null;
        try {
            element = parent.findElement(By.className(className));
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

    /**
     * Asserts the reaction count shown in the summary widget
     */
    public void assertSummaryCount(int count) {
        WebElement element = findByXpath(String.format("//span[contains(@class,'%s')]", AntennaConstants.CLASS_SUMMARY_TITLE));
        Assert.assertNotNull("summary widget title not found", element);

        Assert.assertEquals("wrong summary widget title", count + " Reactions", element.getText());
    }

    /**
     * Asserts the number of media indicators on the page.
     */
    public void assertMediaIndicatorCount(int count) {
        WebElement bucket = findById(AntennaConstants.ID_WIDGET_BUCKET);
        Assert.assertNotNull("widget bucket not found", bucket);

        List<WebElement> mediaIndicators = bucket.findElements(By.className(AntennaConstants.CLASS_MEDIA_INDICATOR));
        Assert.assertEquals("wrong number of media indicators", count, mediaIndicators.size());
    }

    /**
     * Asserts the number of text indicators on the page.
     */
    public void assertTextIndicatorCount(int count) {
        List<WebElement> textIndicators = driver.findElements(By.className(AntennaConstants.CLASS_TEXT_INDICATOR));
        Assert.assertEquals("wrong number of text indicators", count, textIndicators.size());
    }

    /**
     * Asserts the reaction count shown inside the given text element.
     */
    public void assertTextReactionCount(WebElement textElement, int reactionCount) {
        WebElement textIndicator = textElement.findElement((By.className(AntennaConstants.CLASS_TEXT_INDICATOR)));
        Assert.assertNotNull("text indicator not found", textIndicator);

        WebElement countElement = findByClassName(AntennaConstants.CLASS_TEXT_REACTION_COUNT, textIndicator);
        if (reactionCount > 0) {
            Assert.assertNotNull("text count not found", countElement);
            // Selenium's getText() doesn't include hidden text. So get the text with Javascript.
            int actualCount = Integer.parseInt((String) driver.executeScript("return arguments[0].innerHTML", countElement));
            Assert.assertEquals("incorrect text reaction count", reactionCount, actualCount);
        } else {
            Assert.assertNull("text reactions found where none were expected", countElement);
        }
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

    public void assertTextIndicatorOpacityOnHover(WebElement container, WebElement indicator, double expectedOpacity) {
        // Hover the paragraph and make sure the opacity changes as expected
        hover(container);
        // The indicator opacity fades in over 300ms...
        (new WebDriverWait(driver, 1)).withMessage("indicator opacity didn't change").until(new ExpectedCondition<Boolean>() {
            @Override
            public Boolean apply(WebDriver webDriver) {
                try {
                    float opacity = Float.parseFloat(indicator.getCssValue("opacity"));
                    Assert.assertEquals("incorrect opacity on text indicator", expectedOpacity, opacity, 0.1);
                } catch (AssertionError e) {
                    return false;
                }
                return true;
            }
        });
    }

}
