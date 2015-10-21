import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.List;

/**
 * Tests our handling of dynamically added/changed content elements (image, text, TODO: media).
 */
public class DynamicContentTests extends AbstractWidgetTests {

    private static String url = "http://localhost:3000/pages/dynamic-content/page.html";

    @Test
    public void testAddSummary() {
        driver.get(url);
        assertImageIndicatorCount(1);

        String buttonId = "add-summary";
        WebElement button = findById(buttonId);
        Assert.assertNotNull("button not found", button);
        button.click();
        WebElement insertedDiv = findByXpath(String.format("//button[@id='%s']/following-sibling::div/div[contains(@class, 'summary')]", buttonId));
        Assert.assertNotNull("inserted div not found in expected location", insertedDiv);
        WebElement insertedSummary = findByXpath(String.format("//button[@id='%s']/following-sibling::div/div[contains(@class, 'summary')]/following-sibling::div[contains(@class, '%s')]", buttonId, AntennaConstants.CLASS_SUMMARY_WIDGET));
        Assert.assertNotNull("summary not created as expected", insertedSummary);
    }

    @Test
    public void testAddText() {
        driver.get(url);
        assertTextIndicatorCount(1);

        String buttonId = "add-text";
        WebElement button = findById(buttonId);
        Assert.assertNotNull("button not found", button);
        button.click();
        WebElement inserted = findByXpath(String.format("//button[@id='%s']/following-sibling::p", buttonId));
        Assert.assertNotNull("inserted p tag not found in expected location", inserted);
        assertTextIndicatorCount(2);
    }

    @Test
    public void testAddTextNoAnt() {
        driver.get(url);
        assertTextIndicatorCount(1);

        String buttonId = "add-text-noant";
        WebElement button = findById(buttonId);
        Assert.assertNotNull("button not found", button);
        button.click();
        WebElement inserted = findByXpath(String.format("//button[@id='%s']/following-sibling::p", buttonId));
        Assert.assertNotNull("inserted p tag not found in expected location", inserted);
        assertTextIndicatorCount(1);
    }

    @Test
    public void testAddImage() {
        driver.get(url);
        assertImageIndicatorCount(1);

        String buttonId = "add-image";
        WebElement button = findById(buttonId);
        Assert.assertNotNull("button not found", button);
        button.click();
        WebElement insertedImage = findByXpath(String.format("//button[@id='%s']/following-sibling::img", buttonId));
        Assert.assertNotNull("inserted image not found in expected location", insertedImage);
        assertImageIndicatorCount(2);
    }

    @Test
    public void testAddImageNested() {
        driver.get(url);
        assertImageIndicatorCount(1);

        String buttonId = "add-image-nested";
        WebElement button = findById(buttonId);
        Assert.assertNotNull("button not found", button);
        button.click();
        WebElement insertedImage = findByXpath(String.format("//button[@id='%s']/following-sibling::div/img", buttonId));
        Assert.assertNotNull("inserted image not found in expected location", insertedImage);
        assertImageIndicatorCount(2);
    }

    @Test
    public void testAddImageNoAnt() {
        driver.get(url);
        assertImageIndicatorCount(1);

        String buttonId = "add-image-noant";
        WebElement button = findById(buttonId);
        Assert.assertNotNull("button not found", button);
        button.click();
        WebElement insertedImage = findByXpath(String.format("//button[@id='%s']/following-sibling::div[contains(@class, 'no-ant')]/img", buttonId));
        Assert.assertNotNull("inserted image not found in expected location", insertedImage);
        assertImageIndicatorCount(1);
    }

    @Test
    public void testAddInsideExcluded() {
        driver.get(url);
        assertImageIndicatorCount(1);

        String buttonId = "add-inside-excluded";
        WebElement button = findById(buttonId);
        Assert.assertNotNull("button not found", button);
        button.click();
        WebElement insertedImage = findByXpath(String.format("//div[contains(@class, 'ant-exclude')]/button[@id='%s']/following-sibling::div/img", buttonId));
        Assert.assertNotNull("inserted image not found in expected location", insertedImage);
        assertImageIndicatorCount(1);
    }

    @Test
    public void testAddNestedExclude() {
        driver.get(url);
        assertImageIndicatorCount(1);

        String buttonId = "add-nested-exclude";
        WebElement button = findById(buttonId);
        Assert.assertNotNull("button not found", button);
        button.click();
        WebElement insertedImage = findByXpath(String.format("//button[@id='%s']/following-sibling::div[contains(@class, 'ant-exclude')]/img", buttonId));
        Assert.assertNotNull("inserted image not found in expected location", insertedImage);
        assertImageIndicatorCount(1);
    }

    @Test
    public void testAddExcluded() {
        driver.get(url);
        assertImageIndicatorCount(1);

        String buttonId = "add-excluded";
        WebElement button = findById(buttonId);
        Assert.assertNotNull("button not found", button);
        button.click();
        WebElement insertedImage = findByXpath(String.format("//button[@id='%s']/following-sibling::img[contains(@class, 'ant-exclude')]", buttonId));
        Assert.assertNotNull("inserted image not found in expected location", insertedImage);
        assertImageIndicatorCount(1);
    }

    @Test
    public void testAddDelayedSrcImage() {
        driver.get(url);
        assertImageIndicatorCount(1);

        String buttonId = "add-delayed-src-image";
        WebElement button = findById(buttonId);
        Assert.assertNotNull("button not found", button);
        button.click();
        WebElement insertedImage = findByXpath(String.format("//button[@id='%s']/following-sibling::img", buttonId));
        Assert.assertNotNull("inserted image not found in expected location", insertedImage);
        assertImageIndicatorCount(1);
        // The image gets a 'src' attribute after a 1 second delay...
        (new WebDriverWait(driver, 2)).withMessage("wrong number of image indicators").until(new ExpectedCondition<Boolean>() {
            @Override
            public Boolean apply(WebDriver webDriver) {
                try {
                    assertImageIndicatorCount(2);
                } catch (AssertionError e) {
                    return false;
                }
                return true;
            }
        });
    }

    public void assertImageIndicatorCount(int count) {
        WebElement bucket = findById(AntennaConstants.ID_WIDGET_BUCKET);
        Assert.assertNotNull("widget bucket not found", bucket);

        List<WebElement> imageIndicators = bucket.findElements(By.className(AntennaConstants.CLASS_IMAGE_INDICATOR));
        // TODO: consider retrying this a few times to account for any delay
        Assert.assertEquals("wrong number of image indicators", count, imageIndicators.size());
    }

    public void assertTextIndicatorCount(int count) {
        List<WebElement> textIndicators = driver.findElements(By.className(AntennaConstants.CLASS_TEXT_INDICATOR));
        // TODO: consider retrying this a few times to account for any delay
        Assert.assertEquals("wrong number of text indicators", count, textIndicators.size());
    }
}
