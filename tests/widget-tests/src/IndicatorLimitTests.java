import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.WebDriverWait;

public class IndicatorLimitTests extends AbstractWidgetTests {

    public static final String url = "http://localhost:3000/pages/indicator-limit/page.html";

    @Test
    public void testIndicatorLimit() {
        driver.get(url);
        WebElement container;
        WebElement indicator;
        double opacity;

        container = findById("p1");
        Assert.assertNotNull("p tag not found", container);
        indicator = findByXpath(String.format(".//span[contains(@class,'%s')]", AntennaConstants.CLASS_TEXT_INDICATOR), container);
        Assert.assertNotNull("text indicator not found in expected location", indicator);
        opacity = Float.parseFloat(indicator.getCssValue("opacity"));
        Assert.assertEquals("incorrect opacity on text indicator", 0.33, opacity, 0.1);
        assertTextIndicatorOpacityOnHover(container, indicator, 0.66);

        container = findById("p2");
        Assert.assertNotNull("p tag not found", container);
        indicator = findByXpath(String.format(".//span[contains(@class,'%s')]", AntennaConstants.CLASS_TEXT_INDICATOR), container);
        Assert.assertNotNull("text indicator not found in expected location", indicator);
        opacity = Float.parseFloat(indicator.getCssValue("opacity"));
        Assert.assertEquals("incorrect opacity on text indicator", 0.33, opacity, 0.1);
        assertTextIndicatorOpacityOnHover(container, indicator, 0.66);

        container = findById("p3");
        Assert.assertNotNull("p tag not found", container);
        indicator = findByXpath(String.format(".//span[contains(@class,'%s')]", AntennaConstants.CLASS_TEXT_INDICATOR), container);
        Assert.assertNotNull("text indicator not found in expected location", indicator);
        opacity = Float.parseFloat(indicator.getCssValue("opacity"));
        Assert.assertEquals("incorrect opacity on text indicator", 0, opacity, 0.1);
        assertTextIndicatorOpacityOnHover(container, indicator, 0.66);
    }

    //@Test
    // TODO: This test doesn't work. The reactions window isn't opening.
    // TODO: Need to make sure we assure that the reaction window fully opens (wait for any fade-in) and definitively closes (click and wait for any fade-out).
    // TODO: Need to understand how running this test first somehow causes the other test to fail (all indicators remain active).
    public void testIndicatorLimitDisabledOnActivation() {
        driver.get(url);
        WebElement container;
        WebElement indicator;

        container = findById("p3");
        Assert.assertNotNull("p tag not found", container);
        indicator = findByXpath(String.format(".//span[contains(@class,'%s')]", AntennaConstants.CLASS_TEXT_INDICATOR), container);
        Assert.assertNotNull("text indicator not found in expected location", indicator);
        float opacity = Float.parseFloat(indicator.getCssValue("opacity"));
        Assert.assertEquals("incorrect opacity on text indicator", 0, opacity, 0.1);

        // Hover the indicator to summon the reaction window...
        hover(indicator);
        // Then move the mouse away
        hover(findByXpath("//div[contains(@class,'summary')]"));

        opacity = Float.parseFloat(indicator.getCssValue("opacity"));
        Assert.assertEquals("incorrect opacity on text indicator", 0.33, opacity, 0.1);
    }
}
