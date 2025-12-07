import java.util.Scanner;
public class A3_3 {
    public static void main(String[] args)
    {
        Scanner sc = new Scanner(System.in);
        float peso, altura, IMC;
        System.out.println("Introduzca su peso en kg");
        peso = sc.nextFloat();
        System.out.println("Introduzca su altura en metros");
        altura = sc.nextFloat();
        IMC = peso / (altura * altura);
        System.out.println("Su índice de masa corporal es " + IMC);
    }
}
