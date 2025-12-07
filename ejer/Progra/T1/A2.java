import java.util.Scanner;
public class A3_2 {
    public static void main(String[] args)
    {
        Scanner sc = new Scanner(System.in);
        float longitud, altura, area, perimetro;

        System.out.println("Introduzca la longitud del rectángulo en cm");
        longitud = sc.nextFloat();
        System.out.println("Introduzca la altura del rectángulo en cm");
        altura = sc.nextFloat();
        area = longitud * altura;
        perimetro = 2 * (altura + longitud);
        System.out.println("El área del rectángulo es de " + area + "cm");
        System.out.println("El perímetro de rectángulo es de " + perimetro + "cm");
    }
}
