import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;

import java.util.concurrent.TimeUnit;

public class SimpleTest {

    private static FirefoxDriver driver;

    @BeforeClass
    public static void setupDriver() {
        driver = new FirefoxDriver();
        driver.manage().timeouts().implicitlyWait(3, TimeUnit.SECONDS);
    }

    @AfterClass
    public static void quitDriver() {
        driver.quit();
    }

    @Test
    public void testSummaryWidgetLocation() {
        driver.get("http://localhost:3000/pages/simple.html");
        WebElement element;

        element = findElement("//div[contains(@class,'ant-summary-widget')]");
        Assert.assertNotNull("summary widget not found", element);

        element = findElement("//div[contains(@class, 'summary')]/following-sibling::div[contains(@class,'ant-summary-widget')]");
        Assert.assertNotNull("summary not found in expected location", element);
    }

    @Test
    public void testTextIndicatorLocation() {
        driver.get("http://localhost:3000/pages/simple.html");
        WebElement element;

        element = findElement("//p");
        Assert.assertNotNull("p tag not found", element);

        element = findElement("//p/span[contains(@class,'antenna-text-indicator-widget')]");
        Assert.assertNotNull("text indicator not found in expected location", element);
    }

    /**
     * Attempts to find an element and returns either the element or null.
     */
    public WebElement findElement(String xpath) {
        WebElement element = null;
        try {
            element = driver.findElement(By.xpath(xpath));
        } catch (NoSuchElementException e) {
            // Do nothing!
        }
        return element;
    }

}